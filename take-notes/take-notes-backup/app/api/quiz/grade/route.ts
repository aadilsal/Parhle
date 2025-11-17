import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { gradeOpenAnswer, gradeBatchOpenAnswers, BatchGradeItem } from "@/lib/quiz/grader";

const BodySchema = z.object({
  quizId: z.string().nullable(),
  answers: z.record(z.any()),
  totalTimeElapsed: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, answers, totalTimeElapsed } = BodySchema.parse(body);

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // If quizId provided, fetch questions
    let questions: any[] = [];
    if (quizId) {
      const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position", { ascending: true });
      questions = data ?? [];
    } else {
      // If no quizId, expect answers object includes question meta
      questions = Object.keys(answers).map((k) => ({ id: k, ...(answers[k].meta ?? {}) }));
    }

    let totalScore = 0;
    let maxScore = 0;
    const detailed: Record<string, any> = {};

    // Partition questions: auto-gradable (mcq/tf) vs open-ended
    const openItems: BatchGradeItem[] = [];
    for (const q of questions) {
      const qid = q.id;
      const provided = answers[qid];
      const qType = q.type;

      // Default points per question = 1
      const points = 1;
      maxScore += points;

      if (qType === "mcq" || qType === "tf") {
        const correct = String(q.correct_answer ?? "").trim();
        const userAns = provided?.answer ?? provided;
        const isCorrect = String(userAns).trim() === correct;
        const earned = isCorrect ? points : 0;
        totalScore += earned;
        detailed[qid] = { type: qType, correct_answer: correct, user_answer: userAns, score: earned, max: points };
      } else {
        // collect for batch grading
        const userAnswer = provided?.answer ?? provided?.text ?? "";
        openItems.push({ id: qid, question: q.question, expectedAnswer: q.correct_answer ?? null, userAnswer, maxPoints: points });
      }
    }

    // Batch grade open-ended questions
    if (openItems.length > 0) {
      try {
        const batch = await gradeBatchOpenAnswers(openItems);
        for (const r of batch.results) {
          totalScore += Number(r.score ?? 0);
          detailed[r.id] = { type: 'open', score: r.score, max: r.max_points, feedback: r.feedback, breakdown: r.breakdown };
        }
      } catch (err) {
        console.error('Batch grading failed:', err);
        // Fallback to per-item grading
        for (const item of openItems) {
          try {
            const grade = await gradeOpenAnswer({ question: item.question, expectedAnswer: item.expectedAnswer ?? null, userAnswer: item.userAnswer, maxPoints: item.maxPoints });
            totalScore += Number(grade.score ?? 0);
            detailed[item.id] = { type: 'open', score: grade.score, max: grade.max_points, feedback: grade.feedback, breakdown: grade.breakdown };
          } catch (gErr) {
            console.error('Single grading failed for', item.id, gErr);
            detailed[item.id] = { type: 'open', score: 0, max: item.maxPoints, feedback: 'Grading failed' };
          }
        }
      }
    }

    // Persist attempt
    const attemptRecord = {
      quiz_id: quizId,
      user_id: user.id,
      answers: JSON.stringify(answers),
      score: totalScore,
      max_score: maxScore,
      completed_at: new Date().toISOString(),
      metadata: {
        total_time_elapsed: totalTimeElapsed || 0
      }
    };

    const { error: insertErr } = await supabase.from("quiz_attempts").insert([attemptRecord]);
    if (insertErr) console.error("Error inserting attempt:", insertErr);

    return NextResponse.json({ score: totalScore, maxScore, detailed });
  } catch (err: any) {
    console.error("Quiz grade error:", err);
    if (err?.name === "ZodError") return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    return NextResponse.json({ error: "Failed to grade quiz" }, { status: 500 });
  }
}
