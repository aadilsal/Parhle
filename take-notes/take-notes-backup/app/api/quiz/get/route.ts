import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quizId = url.searchParams.get("quizId");
    if (!quizId) return NextResponse.json({ error: "quizId is required" }, { status: 400 });

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Check if user owns this quiz or if it's shared (for now, only owner can access)
    if (quiz.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position", { ascending: true });

    // Extract timer settings from metadata
    const timerEnabled = quiz.metadata?.timer_enabled !== false; // Default true
    const timePerQuestion = quiz.metadata?.time_per_question || 120; // Default 2 minutes

    return NextResponse.json({
      quiz: {
        ...quiz,
        timerEnabled,
        timePerQuestion
      },
      questions
    });
  } catch (err) {
    console.error("Quiz get error:", err);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
