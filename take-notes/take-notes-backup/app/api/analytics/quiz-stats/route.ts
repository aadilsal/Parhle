import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get total quizzes created by user
    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("user_id", user.id);

    if (quizzesError) throw quizzesError;

    // Get quiz attempts with quiz titles
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        score,
        max_score,
        completed_at,
        metadata,
        quizzes (
          title
        )
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (attemptsError) throw attemptsError;

    // Calculate statistics
    const totalQuizzes = quizzes?.length || 0;
    const totalAttempts = attempts?.length || 0;

    let totalScorePercentage = 0;
    let bestScore = 0;

    const recentAttempts = attempts?.map(attempt => ({
      id: attempt.id,
      quiz_title: attempt.quizzes?.[0]?.title || "Untitled Quiz",
      score: attempt.score,
      max_score: attempt.max_score,
      completed_at: attempt.completed_at,
      total_time_elapsed: attempt.metadata?.total_time_elapsed || 0
    })) || [];

    if (attempts && attempts.length > 0) {
      attempts.forEach(attempt => {
        const percentage = (attempt.score / attempt.max_score) * 100;
        totalScorePercentage += percentage;
        if (percentage > bestScore) bestScore = percentage;
      });
    }

    const averageScore = totalAttempts > 0 ? totalScorePercentage / totalAttempts : 0;

    // Mock data for score trend (would need more complex queries for real trend data)
    const scoreTrend = recentAttempts.slice(0, 7).reverse().map((attempt, index) => ({
      date: new Date(attempt.completed_at).toLocaleDateString(),
      score: Math.round((attempt.score / attempt.max_score) * 100)
    }));

    // Mock data for performance by topic (would need category joins)
    const performanceByTopic = [
      { topic: "General", averageScore: averageScore, attempts: totalAttempts }
    ];

    return NextResponse.json({
      totalQuizzes,
      totalAttempts,
      averageScore,
      bestScore,
      recentAttempts,
      scoreTrend,
      performanceByTopic
    });
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    return NextResponse.json({ error: "Failed to fetch quiz statistics" }, { status: 500 });
  }
}