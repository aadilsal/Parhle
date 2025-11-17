import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/gemini";

const BodySchema = z.object({
  quizId: z.string().nullable(),
  questionId: z.string().optional(),
  question: z.string(),
  context: z.string().optional(),
});

const HINT_LIMIT_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, questionId, question, context } = BodySchema.parse(body);

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: count recent hint interactions in ai_interactions
    const since = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const { count } = await supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: false })
      .eq("user_id", user.id)
      .eq("interaction_type", "quiz_hint")
      .gte("created_at", since);

    const used = typeof count === "number" ? count : 0;
    if (used >= HINT_LIMIT_PER_HOUR) {
      return NextResponse.json({ error: "Hint rate limit exceeded" }, { status: 429 });
    }

    // Build hint prompt
    const prompt = `You are a hint generator. Given the question:\n${question}\n${context ? `Context: ${context}\n` : ""}Provide a short hint (1-2 sentences) that nudges the user without giving away the answer. Return only the hint text.`;

    const hint = await generateText(prompt);

    // Persist interaction for auditing and rate-limiting
    await supabase.from("ai_interactions").insert([
      {
        user_id: user.id,
        note_id: null,
        interaction_type: "quiz_hint",
        input_text: question.substring(0, 1000),
        output_text: (typeof hint === "string" ? hint : JSON.stringify(hint)).substring(0, 2000),
        metadata: { quiz_id: quizId, question_id: questionId },
      },
    ]);

    return NextResponse.json({ hint });
  } catch (err: any) {
    console.error("Hint generation error:", err);
    if (err?.name === "ZodError") return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 });
  }
}
