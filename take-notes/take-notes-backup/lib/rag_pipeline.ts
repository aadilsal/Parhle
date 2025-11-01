import { embedText } from "./embeddings";
import { retrieveByEmbedding } from "./retriever";
import { generateText } from "@/lib/gemini";

/**
 * Assemble retrieved chunks and query into a prompt and call the LLM.
 * Returns the generated answer and the chunks used as context.
 */
export async function answerWithContext(query: string, options?: { docId?: string; topK?: number }) {
  const topK = options?.topK ?? 5;
  const docId = options?.docId;
  // 1) embed query
  const qEmb = await embedText(query);
  // 2) retrieve
  const retrieved = await retrieveByEmbedding(qEmb, topK, docId);

  // 3) build prompt
  const contextText = retrieved.map((r, i) => `SOURCE ${i + 1} (score=${r.score.toFixed(3)}):\n${r.text}`).join("\n\n");

  const prompt = `You are an assistant that answers user questions using the provided context.\n\nContext:\n${contextText}\n\nUser question:\n${query}\n\nProvide a concise, accurate answer and cite which SOURCE numbers you used.`;

  // 4) call model
  const answer = await generateText(prompt);
  return { answer, sources: retrieved };
}
