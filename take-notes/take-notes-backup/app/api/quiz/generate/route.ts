import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateQuiz } from "@/lib/quiz/generator";

const BodySchema = z.object({
  category: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  numQuestions: z.number().int().min(1).max(50).optional(),
  title: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, difficulty, numQuestions, title } = BodySchema.parse(body);

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate quiz via Gemini
    const quiz = await generateQuiz({ category, difficulty, numQuestions });

    // Persist quiz metadata and questions
    const { data: quizRow, error: quizErr } = await supabase
      .from("quizzes")
      .insert([
        {
          user_id: user.id,
          category_id: null,
          difficulty: difficulty ?? "medium",
          title: title ?? quiz.title ?? `${category} Quiz`,
          description: null,
          ai_generated: true,
        },
      ])
      .select()
      .single();

    if (quizErr) {
      console.error("Error inserting quiz:", quizErr);
      return NextResponse.json({ error: quizErr.message }, { status: 500 });
    }

    const questionsToInsert = (quiz.questions || []).map((q, idx) => ({
      quiz_id: quizRow.id,
      type: q.type,
      question: q.question,
      options: q.options ?? [],
      correct_answer: q.correct_answer ?? null,
      rationale: q.rationale ?? null,
      ai_generated: true,
      position: idx,
    }));

    if (questionsToInsert.length > 0) {
      const { error: qErr } = await supabase.from("quiz_questions").insert(questionsToInsert);
      if (qErr) console.error("Error inserting questions:", qErr);
    }

    return NextResponse.json({ quizId: quizRow.id, quiz });
  } catch (err: any) {
    console.error("Quiz generate error:", err);
    if (err?.name === "ZodError") return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
