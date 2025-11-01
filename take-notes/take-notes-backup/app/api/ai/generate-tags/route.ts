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

    const { content, noteId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const prompt = `Analyze the following text and generate 3-5 relevant tags that best describe the content. Return only the tags as a comma-separated list, no explanations or extra text:\n\n${content}`
    const result = await generateText(prompt)

    // Parse the tags from the response
    const tags = result
      .split(",")
      .map((tag: string) => tag.trim().replace(/['"]/g, ""))
      .filter((tag: string) => tag.length > 0 && tag.length < 30)
      .slice(0, 5)

    // Save AI interaction to database
    if (noteId) {
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        note_id: noteId,
        interaction_type: "generate_tags",
        input_text: content.substring(0, 1000),
        output_text: tags.join(", "),
      })
    }

    return NextResponse.json({ result: tags })
  } catch (error) {
    console.error("AI Generate Tags Error:", error)
    return NextResponse.json({ error: "Failed to generate tags" }, { status: 500 })
  }
}
