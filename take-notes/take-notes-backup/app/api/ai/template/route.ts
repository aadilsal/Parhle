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

    const { type, noteId } = await request.json()

    if (!type) {
      return NextResponse.json({ error: "Template type is required" }, { status: 400 })
    }

    const templates = {
      meeting: `Generate a comprehensive meeting notes template in markdown format with the following sections:
- Meeting Details (Date, Time, Attendees, Location)
- Agenda Items
- Discussion Points
- Action Items with assignees and due dates
- Next Steps
- Follow-up Required`,
      project: `Generate a project planning template in markdown format with:
- Project Overview and Objectives
- Timeline and Milestones
- Team Members and Roles
- Resources Required
- Budget Considerations
- Risk Assessment
- Success Metrics
- Next Actions`,
      daily: `Generate a daily journal template in markdown format with:
- Date and Weather
- Daily Goals and Priorities
- Accomplishments
- Challenges Faced
- Lessons Learned
- Gratitude Section
- Tomorrow's Focus
- Mood and Energy Level`,
      research: `Generate a research notes template in markdown format with:
- Research Topic and Questions
- Sources and References
- Key Findings
- Methodology
- Data Analysis
- Conclusions
- Further Research Needed
- Bibliography`,
    }

    const prompt = templates[type as keyof typeof templates] || templates.meeting
    const template = await generateText(prompt)

    // Save AI interaction to database
    if (noteId) {
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        note_id: noteId,
        interaction_type: "template",
        output_text: template,
        metadata: { type },
      })
    }

    return NextResponse.json({ result: template })
  } catch (error) {
    console.error("AI Template Error:", error)
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 })
  }
}
