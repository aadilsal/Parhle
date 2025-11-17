import { z } from "zod";
import { generateText } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "tf", "short", "essay", "image", "audio"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  rationale: z.string().optional(),
});

export const QuizSchema = z.object({
  title: z.string().optional(),
  questions: z.array(QuizQuestionSchema),
});

export type Quiz = z.infer<typeof QuizSchema>;

export async function generateQuiz(params: {
  category: string;
  difficulty?: "easy" | "medium" | "hard";
  numQuestions?: number;
}) {
  const { category, difficulty = "medium", numQuestions = 5 } = params;

  // Strict JSON-only prompt asking Gemini to return machine-readable output
  const prompt = `You are an expert quiz generator. Generate ${numQuestions} questions on the topic "${category}" at ${difficulty} difficulty. Mix multiple types: mcq (4 options), tf, short, essay.

Return JSON only with the structure:
{ "quiz": { "title": "...", "questions": [ { "id": "q1", "type": "mcq", "question": "...", "options": ["...","...","...","..."], "correct_answer": "...", "rationale": "..." }, ... ] } }

Do not return any extra text. Ensure JSON parses correctly.`;

  const raw = await generateText(prompt);

  // Try parse and validate
  try {
    const parsed = JSON.parse(raw);
    const result = QuizSchema.parse(parsed.quiz ?? parsed);
    return result as Quiz;
  } catch (err) {
    // Fallback: try to extract JSON block from text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = QuizSchema.parse(parsed.quiz ?? parsed);
        return result as Quiz;
      } catch (err2) {
        throw new Error("Failed to parse quiz JSON: " + String(err2));
      }
    }

    throw new Error("Failed to parse quiz JSON: " + String(err));
  }
}

export async function generateQuizFromNotes(params: {
  noteIds: string[];
  difficulty?: "easy" | "medium" | "hard";
  numQuestions?: number;
  title?: string;
}) {
  const { noteIds, difficulty = "medium", numQuestions = 5, title } = params;

  if (!noteIds.length) {
    throw new Error("At least one note ID is required");
  }

  // Fetch note contents from database
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, content")
    .in("id", noteIds);

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  if (!notes || notes.length === 0) {
    throw new Error("No notes found with the provided IDs");
  }

  // Combine note contents into context
  const contextText = notes
    .map((note, index) => `NOTE ${index + 1} - ${note.title}:\n${note.content || "No content"}`)
    .join("\n\n");

  // Create a comprehensive prompt using the notes content
  const prompt = `You are an expert quiz generator. Generate ${numQuestions} questions based on the following notes at ${difficulty} difficulty level. Mix multiple question types: mcq (4 options), tf, short, essay.

NOTES CONTENT:
${contextText}

Instructions:
- Create questions that test understanding of the content in these notes
- For MCQ questions, provide exactly 4 options with one correct answer
- For true/false questions, the correct_answer should be "true" or "false"
- For short answer questions, provide a concise expected answer
- For essay questions, provide guidance on what should be covered
- Include detailed rationale explaining why the answer is correct and referencing the source material
- Ensure questions cover different aspects of the notes content

Return JSON only with the structure:
{
  "quiz": {
    "title": "${title || "Quiz from Selected Notes"}",
    "questions": [
      {
        "id": "q1",
        "type": "mcq",
        "question": "...",
        "options": ["option1", "option2", "option3", "option4"],
        "correct_answer": "option1",
        "rationale": "..."
      },
      ...
    ]
  }
}

Do not return any extra text. Ensure JSON parses correctly.`;

  const raw = await generateText(prompt);

  // Try parse and validate
  try {
    const parsed = JSON.parse(raw);
    const result = QuizSchema.parse(parsed.quiz ?? parsed);
    return result as Quiz;
  } catch (err) {
    // Fallback: try to extract JSON block from text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = QuizSchema.parse(parsed.quiz ?? parsed);
        return result as Quiz;
      } catch (err2) {
        throw new Error("Failed to parse quiz JSON: " + String(err2));
      }
    }

    throw new Error("Failed to parse quiz JSON: " + String(err));
  }
}
