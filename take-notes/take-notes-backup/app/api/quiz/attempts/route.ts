import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const QuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(title, category_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching attempts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attempts: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Body should contain quizId, answers, score, maxScore
    const { quizId, answers, score, maxScore } = body;
    const record = {
      quiz_id: quizId,
      user_id: user.id,
      answers,
      score,
      max_score: maxScore,
      completed_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("quiz_attempts").insert([record]);
    if (error) {
      console.error("Error inserting attempt:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create attempt" }, { status: 500 });
  }
}
