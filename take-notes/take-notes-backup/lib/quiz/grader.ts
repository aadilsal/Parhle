import { generateText } from "@/lib/gemini";

export type GradeResult = {
  score: number;
  max_points: number;
  feedback: string;
  breakdown?: { criteria: string; points: number }[];
};

/**
 * Ask Gemini to grade an open-ended answer and return structured JSON.
 * The model is asked to return JSON only.
 */
export async function gradeOpenAnswer(opts: {
  question: string;
  expectedAnswer?: string | null;
  userAnswer: string;
  maxPoints?: number;
}): Promise<GradeResult> {
  const { question, expectedAnswer = null, userAnswer, maxPoints = 5 } = opts;

  const prompt = `You are an impartial grader. Grade the user's answer to the following question and return JSON only.
{
  "question": ${JSON.stringify(question)},
  "expected_answer": ${JSON.stringify(expectedAnswer)},
  "user_answer": ${JSON.stringify(userAnswer)},
  "max_points": ${maxPoints}
}

Return strictly: {"score": <number>, "max_points": <number>, "feedback": "<concise feedback>", "breakdown": [{"criteria":"...","points":n}]}
Give a numeric score and brief, constructive feedback.`;

  const raw = await generateText(prompt);

  try {
    const parsed = JSON.parse(raw);
    const score = Number(parsed.score ?? 0);
    const max_points = Number(parsed.max_points ?? maxPoints);
    const feedback = String(parsed.feedback ?? "");
    const breakdown = Array.isArray(parsed.breakdown) ? parsed.breakdown : undefined;

    return { score, max_points, feedback, breakdown };
  } catch (err) {
    // If parsing fails, return a fallback with minimal feedback
    return {
      score: 0,
      max_points: maxPoints,
      feedback: `Could not parse grader output. Raw response: ${String(raw).slice(0, 500)}`,
    };
  }
}

export type BatchGradeItem = {
  id: string;
  question: string;
  expectedAnswer?: string | null;
  userAnswer: string;
  maxPoints?: number;
};

export type BatchGradeResult = {
  results: Array<{ id: string; score: number; max_points: number; feedback: string; breakdown?: any[] }>;
};

/**
 * Batch grade multiple open answers in a single Gemini call. Returns parsed results.
 */
export async function gradeBatchOpenAnswers(items: BatchGradeItem[]): Promise<BatchGradeResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { results: [] };
  }

  const payload = items.map((it) => ({
    id: it.id,
    question: it.question,
    expected_answer: it.expectedAnswer ?? null,
    user_answer: it.userAnswer,
    max_points: it.maxPoints ?? 1,
  }));

  const prompt = `You are a strict grader. Given the following JSON array, grade each item and return JSON only in the format {"results": [{"id":"<id>","score": <number>, "max_points": <number>, "feedback": "...", "breakdown": [{"criteria":"...","points": n}] }, ...] }.

Input:
${JSON.stringify(payload, null, 2)}

Return only valid JSON.`;

  const raw = await generateText(prompt);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.results)) throw new Error('Invalid batch grader output');
    const results = parsed.results.map((r: any) => ({
      id: String(r.id),
      score: Number(r.score ?? 0),
      max_points: Number(r.max_points ?? 1),
      feedback: String(r.feedback ?? ""),
      breakdown: Array.isArray(r.breakdown) ? r.breakdown : undefined,
    }));
    return { results };
  } catch (err) {
    // try to extract JSON block
    const jsonMatch = String(raw).match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const results = (parsed.results || []).map((r: any) => ({
          id: String(r.id),
          score: Number(r.score ?? 0),
          max_points: Number(r.max_points ?? 1),
          feedback: String(r.feedback ?? ""),
          breakdown: Array.isArray(r.breakdown) ? r.breakdown : undefined,
        }));
        return { results };
      } catch (err2) {
        throw new Error('Failed to parse batch grader output: ' + String(err2));
      }
    }

    throw new Error('Failed to parse batch grader output: ' + String(err));
  }
}
