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

    const { text, language, noteId } = await request.json()

    if (!text || !language) {
      return NextResponse.json({ error: "Text and language are required" }, { status: 400 })
    }

    const prompt = `Translate the following text to ${language}. Only return the translation:\n\n${text}`
    const translated = await generateText(prompt)

    // Save AI interaction to database
    if (noteId) {
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        note_id: noteId,
        interaction_type: "translate",
        input_text: text.substring(0, 1000),
        output_text: translated,
        metadata: { language },
      })
    }

    return NextResponse.json({ result: translated })
  } catch (error) {
    console.error("AI Translate Error:", error)
    return NextResponse.json({ error: "Failed to translate text" }, { status: 500 })
  }
}
