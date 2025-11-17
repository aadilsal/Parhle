import { generateQuiz } from '@/lib/quiz/generator';
import * as gemini from '@/lib/gemini';

// Mock the Gemini module
jest.mock('@/lib/gemini', () => ({
  generateText: jest.fn(),
}));

describe('Quiz Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a valid quiz with mixed question types', async () => {
    const mockResponse = JSON.stringify({
      quiz: {
        title: 'JavaScript Basics',
        questions: [
          {
            id: 'q1',
            type: 'mcq',
            question: 'What is a closure?',
            options: ['A function', 'A variable', 'A scope', 'None'],
            correct_answer: 'A function',
            rationale: 'Closures are functions that have access to outer scope',
          },
          {
            id: 'q2',
            type: 'tf',
            question: 'JavaScript is single-threaded',
            correct_answer: 'True',
            rationale: 'JS runs on a single thread with event loop',
          },
        ],
      },
    });

    (gemini.generateText as jest.Mock).mockResolvedValue(mockResponse);

    const result = await generateQuiz({
      category: 'JavaScript',
      difficulty: 'medium',
      numQuestions: 2,
    });

    expect(result).toBeDefined();
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].type).toBe('mcq');
    expect(result.questions[1].type).toBe('tf');
  });

  it('should handle malformed JSON by extracting JSON block', async () => {
    const mockResponse = `Here is your quiz:
    {
      "quiz": {
        "title": "Test",
        "questions": [{"id": "q1", "type": "mcq", "question": "Test?", "options": ["A","B"], "correct_answer": "A"}]
      }
    }
    Hope this helps!`;

    (gemini.generateText as jest.Mock).mockResolvedValue(mockResponse);

    const result = await generateQuiz({
      category: 'Test',
      difficulty: 'easy',
      numQuestions: 1,
    });

    expect(result).toBeDefined();
    expect(result.questions).toHaveLength(1);
  });

  it('should throw error when JSON is completely invalid', async () => {
    (gemini.generateText as jest.Mock).mockResolvedValue('This is not JSON at all!');

    await expect(
      generateQuiz({ category: 'Test', difficulty: 'easy', numQuestions: 1 })
    ).rejects.toThrow('Failed to parse quiz JSON');
  });
});
