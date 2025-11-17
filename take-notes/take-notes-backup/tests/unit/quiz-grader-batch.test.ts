import { gradeBatchOpenAnswers } from '@/lib/quiz/grader';
import * as gemini from '@/lib/gemini';

jest.mock('@/lib/gemini');
const mockedGenerateText = gemini.generateText as jest.MockedFunction<typeof gemini.generateText>;

describe('Batch Grader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse batch grader output and return results', async () => {
    const mockResponse = JSON.stringify({
      results: [
        { id: 'q1', score: 2, max_points: 3, feedback: 'Partial', breakdown: [{ criteria: 'Accuracy', points: 2 }] },
        { id: 'q2', score: 1, max_points: 1, feedback: 'Correct' },
      ],
    });

    mockedGenerateText.mockResolvedValue(mockResponse);

    const items = [
      { id: 'q1', question: 'Explain X', userAnswer: '...', maxPoints: 3 },
      { id: 'q2', question: 'True or False Y', userAnswer: 'True', maxPoints: 1 },
    ];

    const res = await gradeBatchOpenAnswers(items as any);

    expect(res.results).toHaveLength(2);
    expect(res.results[0].id).toBe('q1');
    expect(res.results[0].score).toBe(2);
    expect(res.results[1].id).toBe('q2');
    expect(res.results[1].score).toBe(1);
  });

  it('should attempt to extract JSON if model returns surrounding text', async () => {
    const raw = `Here you go:\n{"results":[{"id":"q1","score":1,"max_points":1,"feedback":"Ok"}]}`;
    mockedGenerateText.mockResolvedValue(raw);

    const items = [{ id: 'q1', question: 'Q', userAnswer: 'A', maxPoints: 1 }];

    const res = await gradeBatchOpenAnswers(items as any);
    expect(res.results[0].id).toBe('q1');
    expect(res.results[0].score).toBe(1);
  });

  it('should throw when output cannot be parsed', async () => {
    mockedGenerateText.mockResolvedValue('not json');
    await expect(gradeBatchOpenAnswers([{ id: 'q1', question: 'Q', userAnswer: '', maxPoints: 1 } as any])).rejects.toThrow();
  });
});
