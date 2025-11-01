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

    const { content, excludeNoteId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Get all user's notes except the current one
    const { data: notes, error } = await supabase
      .from("notes")
      .select("id, title, content, tags")
      .eq("user_id", user.id)
      .neq("id", excludeNoteId)
      .is("deleted_at", null)
      .limit(20) // Limit for performance

    if (error) {
      throw error
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({ result: [] })
    }

    // Create a simplified representation for AI analysis
    const notesForAnalysis = notes
      .map(
        (note) =>
          `ID: ${note.id}
Title: ${note.title || "Untitled"}
Content: ${(note.content || "").substring(0, 200)}
Tags: ${(note.tags || []).join(", ")}`,
      )
      .join("\n\n")

    const prompt = `Given this note content: "${content.substring(0, 500)}"

Find the most semantically similar notes from this list. Consider title, content, and tags for similarity.
Return only the note IDs as a comma-separated list (maximum 5 most similar):

${notesForAnalysis}`

    const result = await generateText(prompt)

    // Extract note IDs from the response
    const relatedIds = result
      .split(",")
      .map((id: string) => id.trim().replace(/[^a-zA-Z0-9-]/g, ""))
      .filter((id: string) => notes.some((note) => note.id === id))
      .slice(0, 5)

    // Save AI interaction to database
    await supabase.from("ai_interactions").insert({
      user_id: user.id,
      note_id: excludeNoteId,
      interaction_type: "related_notes",
      input_text: content.substring(0, 1000),
      output_text: relatedIds.join(", "),
    })

    return NextResponse.json({ result: relatedIds })
  } catch (error) {
    console.error("AI Related Notes Error:", error)
    return NextResponse.json({ error: "Failed to find related notes" }, { status: 500 })
  }
}
