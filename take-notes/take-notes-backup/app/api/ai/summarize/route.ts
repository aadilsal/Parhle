import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, noteId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

  const prompt = `Please provide a concise summary of the following text:\n\n${text}`
  console.debug("[api/ai/summarize] prompt length", { noteId, textLength: text.length, promptLength: prompt.length })
  const summary = await generateText(prompt)
  console.debug("[api/ai/summarize] summary length", { noteId, summaryLength: summary ? String(summary).length : 0 })

    // Save AI interaction to database
    if (noteId) {
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        note_id: noteId,
        interaction_type: "summarize",
        input_text: text.substring(0, 1000), // Limit stored text
        output_text: summary,
      })
    }

    return NextResponse.json({ result: summary })
  } catch (error) {
    console.error("AI Summarize Error:", error)
    return NextResponse.json({ error: "Failed to summarize text" }, { status: 500 })
  }
}
