import fs from "fs";
import path from "path";
import { createClient as createServerSupabase } from "@supabase/supabase-js";
import { generateText } from "@/lib/gemini";

const VECTORS_FILE = path.join(process.cwd(), "take-notes", "data", "vectors.json");

type StoredVector = {
  id: string; // composite id like `${docId}::${chunkIndex}`
  docId?: string;
  chunkIndex: number;
  text: string;
  vector: number[];
  metadata?: Record<string, any>;
};

async function ensureVectorsFile() {
  const dir = path.dirname(VECTORS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(VECTORS_FILE)) fs.writeFileSync(VECTORS_FILE, JSON.stringify([]));
}

function hasSupabaseAdmin() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdminClient() {
  if (!hasSupabaseAdmin()) return null;
  return createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function embedText(text: string): Promise<number[]> {
  // Use Gemini (Google) via the project's existing wrapper to produce a JSON array
  // representing an embedding. This avoids using OpenAI and uses the GEMINI_API_KEY.
  if (!text) return [];
  // Ask Gemini to return a JSON array of floats. We request 512 dims by default.
  const dim = 512;
  const prompt = `Produce a JSON array with ${dim} floating point numbers (between -1 and 1) representing a dense embedding for the following text. Output ONLY the JSON array (no extra commentary).\n\nText:\n"""${text.replace(/\"/g, '\\"')}"""`;

  let respText: string | null = null;
  try {
    respText = await generateText(prompt);
  } catch (err) {
    console.error("embedText: generateText failed:", err);
  }

  if (respText) {
    // Try to parse JSON from the response
    const maybeJson = respText.trim();
    let arr: any = null;
    try {
      arr = JSON.parse(maybeJson);
    } catch (e) {
      // Try to extract first JSON array-looking substring
      const match = maybeJson.match(/\[\s*-?[0-9eE+\-.,\s]+\]/m);
      if (match) {
        try {
          arr = JSON.parse(match[0]);
        } catch (e2) {
          // fallthrough
        }
      }
    }
    if (arr && Array.isArray(arr)) {
      // Ensure numeric conversion
      const vector = arr.map((v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      });
      return vector as number[];
    }
    console.warn("embedText: failed to parse JSON embedding from Gemini response; falling back to deterministic hash vector");
  }

  // Fallback deterministic embedding (stable, non-zero) based on a hash of the text.
  // This avoids failing the whole flow when Gemini is temporarily unavailable.
  function hashToVector(s: string, d = dim) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    const out: number[] = new Array(d);
    let hh = h;
    for (let i = 0; i < d; i++) {
      hh = Math.imul(hh ^ i, 16777619) >>> 0;
      // Map to range [-0.5,0.5]
      out[i] = ((hh % 1000) / 1000 - 0.5);
    }
    // normalize to unit length
    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0) || 1);
    return out.map((v) => v / norm);
  }

  return hashToVector(text, dim);
}
async function saveVectorsToFile(docId: string, chunks: { text: string; vector: number[] }[]) {
  await ensureVectorsFile();
  const raw = fs.readFileSync(VECTORS_FILE, "utf-8");
  const arr: StoredVector[] = JSON.parse(raw || "[]");
  for (let i = 0; i < chunks.length; i++) {
    const id = `${docId}::${i}`;
    arr.push({ id, docId, chunkIndex: i, text: chunks[i].text, vector: chunks[i].vector, metadata: {} });
  }
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(arr, null, 2));
}

/**
 * Save vectors to Supabase table `note_vectors` if admin keys are configured.
 * The expected table schema (you may need to create this in your DB):
 *  - id: uuid (generated)
 *  - note_id: text or uuid
 *  - chunk_index: integer
 *  - text: text
 *  - embedding: vector (pgvector)
 */
async function saveVectorsToSupabase(docId: string, chunks: { text: string; vector: number[] }[]) {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role not configured");

  // Insert rows in a single batch (Postgres will accept array for vector column if schema is vector)
  const rows = chunks.map((c, i) => ({ note_id: String(docId), chunk_index: i, text: c.text, embedding: c.vector }));
  // supabase-js will send the array as JSON; make sure the column type is compatible (vector)
  const { data, error } = await admin.from("note_vectors").insert(rows);
  if (error) throw error;
  return data;
}

export async function saveVectors(docId: string, chunks: { text: string; vector: number[] }[]) {
  if (hasSupabaseAdmin()) {
    try {
      await saveVectorsToSupabase(docId, chunks);
      return;
    } catch (e) {
      console.error("saveVectors supabase failed, falling back to file store:", e);
    }
  }
  await saveVectorsToFile(docId, chunks);
}

export async function listAllVectors(): Promise<StoredVector[]> {
  if (hasSupabaseAdmin()) {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin!.from("note_vectors").select("note_id, chunk_index, text, embedding");
      if (error) {
        console.error("listAllVectors supabase select error:", error);
      } else if (Array.isArray(data)) {
        return data.map((r: any) => ({ id: `${r.note_id}::${r.chunk_index}`, docId: String(r.note_id), chunkIndex: r.chunk_index, text: r.text, vector: r.embedding }));
      }
    } catch (e) {
      console.error("listAllVectors supabase failed:", e);
    }
  }

  await ensureVectorsFile();
  const raw = fs.readFileSync(VECTORS_FILE, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

export type { StoredVector };
