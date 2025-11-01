import { listAllVectors, StoredVector } from "./embeddings";

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}

export async function retrieveByEmbedding(queryEmbedding: number[], topK = 5, docId?: string) {
  const all = await listAllVectors();
  const filtered = docId ? all.filter((v) => v.docId === docId) : all;
  const scored = filtered
    .map((v) => ({ v, score: dot(v.vector, queryEmbedding) / (norm(v.vector) * norm(queryEmbedding) || 1e-8) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => ({ id: s.v.id, text: s.v.text, score: s.score }));
  return scored;
}

export async function retrieveByText(queryText: string, embedFn: (t: string) => Promise<number[]>, topK = 5, docId?: string) {
  const qEmb = await embedFn(queryText);
  return retrieveByEmbedding(qEmb, topK, docId);
}
