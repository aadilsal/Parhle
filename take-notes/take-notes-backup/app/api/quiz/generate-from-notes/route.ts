import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateQuizFromNotes } from "@/lib/quiz/generator";

const BodySchema = z.object({
  noteIds: z.array(z.string()).min(1, "At least one note ID is required"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  numQuestions: z.number().int().min(1).max(50).optional(),
  title: z.string().optional(),
  timerEnabled: z.boolean().optional(),
  timePerQuestion: z.number().int().min(30).max(3600).optional(), // 30 seconds to 1 hour
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteIds, difficulty, numQuestions, title, timerEnabled, timePerQuestion } = BodySchema.parse(body);

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify that the user owns all the notes
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, title")
      .in("id", noteIds)
      .eq("user_id", user.id);

    if (notesError) {
      console.error("Error fetching notes:", notesError);
      return NextResponse.json({ error: "Failed to verify notes ownership" }, { status: 500 });
    }

    if (!notes || notes.length !== noteIds.length) {
      return NextResponse.json({ error: "Some notes not found or not owned by user" }, { status: 404 });
    }

    // Generate quiz from notes content
    const quiz = await generateQuizFromNotes({
      noteIds,
      difficulty,
      numQuestions,
      title: title || `Quiz from ${notes.length} note${notes.length > 1 ? 's' : ''}`
    });

    // Persist quiz metadata and questions
    const { data: quizRow, error: quizErr } = await supabase
      .from("quizzes")
      .insert([
        {
          user_id: user.id,
          category_id: null, // Could be derived from notes later
          difficulty: difficulty ?? "medium",
          title: quiz.title || title || `Quiz from ${notes.length} notes`,
          description: `Generated from ${notes.length} note${notes.length > 1 ? 's' : ''}: ${notes.map(n => n.title).join(', ')}`,
          ai_generated: true,
          metadata: {
            source_note_ids: noteIds,
            source_note_titles: notes.map(n => n.title),
            generation_method: "from_notes",
            timer_enabled: timerEnabled ?? true,
            time_per_question: timePerQuestion ?? 120
          }
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
      metadata: {
        source_notes: noteIds
      }
    }));

    if (questionsToInsert.length > 0) {
      const { error: qErr } = await supabase.from("quiz_questions").insert(questionsToInsert);
      if (qErr) {
        console.error("Error inserting questions:", qErr);
        // Don't fail the whole request if questions fail to insert
      }
    }

    return NextResponse.json({
      quizId: quizRow.id,
      quiz: {
        ...quiz,
        timerEnabled: timerEnabled ?? true,
        timePerQuestion: timePerQuestion ?? 120
      },
      sourceNotes: notes.map(n => ({ id: n.id, title: n.title }))
    });
  } catch (err: any) {
    console.error("Quiz generate from notes error:", err);
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to generate quiz from notes" }, { status: 500 });
  }
}