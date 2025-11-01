import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateText(prompt: string): Promise<string> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error(`Gemini API Error (attempt ${attempt}/${maxAttempts}):`, error?.message ?? error);
      if (attempt < maxAttempts) {
        // exponential backoff
        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw new Error("Failed to generate text");
    }
  }
  // unreachable but satisfy TypeScript
  throw new Error("Failed to generate text");
}
