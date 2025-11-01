import { NextResponse } from "next/server";
import { answerWithContext } from "@/lib/rag_pipeline";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, docId } = body ?? {};
    if (!query) {
      // initial greeting
      return NextResponse.json({ message: "What would you like to do with your notes today?" });
    }

    const result = await answerWithContext(String(query), { docId, topK: 5 });
    return NextResponse.json({ ok: true, answer: result.answer, sources: result.sources });
  } catch (err: any) {
    console.error("/api/ai/rag error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
