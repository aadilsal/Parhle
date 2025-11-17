import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { gradeOpenAnswer } from '@/lib/quiz/grader';
import * as gemini from '@/lib/gemini';

// Mock the Gemini module
jest.mock('@/lib/gemini');

const mockedGenerateText = gemini.generateText as jest.MockedFunction<typeof gemini.generateText>;

describe('Quiz Grader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should grade an open answer and return structured feedback', async () => {
    const mockResponse = JSON.stringify({
      score: 4,
      max_points: 5,
      feedback: 'Good answer, but could include more details about scope.',
      breakdown: [
        { criteria: 'Accuracy', points: 2 },
        { criteria: 'Completeness', points: 2 },
      ],
    });

    mockedGenerateText.mockResolvedValue(mockResponse);

    const result = await gradeOpenAnswer({
      question: 'Explain closures in JavaScript',
      expectedAnswer: 'A closure is a function that retains access to its outer scope',
      userAnswer: 'A closure is when a function remembers variables from outside',
      maxPoints: 5,
    });

    expect(result.score).toBe(4);
    expect(result.max_points).toBe(5);
    expect(result.feedback).toContain('Good answer');
    expect(result.breakdown).toHaveLength(2);
  });

  it('should handle grading without expected answer', async () => {
    const mockResponse = JSON.stringify({
      score: 3,
      max_points: 5,
      feedback: 'Partially correct',
    });

    mockedGenerateText.mockResolvedValue(mockResponse);

    const result = await gradeOpenAnswer({
      question: 'What is React?',
      userAnswer: 'A JavaScript library',
      maxPoints: 5,
    });

    expect(result.score).toBe(3);
    expect(result.feedback).toBe('Partially correct');
  });

  it('should return fallback feedback when JSON parsing fails', async () => {
    mockedGenerateText.mockResolvedValue('Not JSON response');

    const result = await gradeOpenAnswer({
      question: 'Test question',
      userAnswer: 'Test answer',
      maxPoints: 5,
    });

    expect(result.score).toBe(0);
    expect(result.max_points).toBe(5);
    expect(result.feedback).toContain('Could not parse grader output');
  });
});
