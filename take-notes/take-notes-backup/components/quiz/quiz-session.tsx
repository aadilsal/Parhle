"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useQuizStore } from "@/hooks/use-quiz-store";
import QuestionCard from "@/components/quiz/question-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Eye,
  Flag,
  Check,
  X,
  AlertCircle,
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizSession({ initialQuiz }: { initialQuiz: any }) {
  const setQuiz = useQuizStore((s) => s.setQuiz);
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const answers = useQuizStore((s) => s.answers);
  const setAnswer = useQuizStore((s) => s.setAnswer);
  const next = useQuizStore((s) => s.next);
  const prev = useQuizStore((s) => s.prev);
  const submitStart = useQuizStore((s) => s.submitStart);
  const submitEnd = useQuizStore((s) => s.submitEnd);
  const saveProgress = useQuizStore((s) => s.saveProgress);
  const loadProgress = useQuizStore((s) => s.loadProgress);
  const clearProgress = useQuizStore((s) => s.clearProgress);
  const hasSavedProgress = useQuizStore((s) => s.hasSavedProgress);

  // Timer state
  const timerEnabled = useQuizStore((s) => s.timerEnabled);
  const timeRemaining = useQuizStore((s) => s.timeRemaining);
  const totalTimeElapsed = useQuizStore((s) => s.totalTimeElapsed);
  const isTimerRunning = useQuizStore((s) => s.isTimerRunning);
  const startTimer = useQuizStore((s) => s.startTimer);
  const pauseTimer = useQuizStore((s) => s.pauseTimer);
  const resetTimer = useQuizStore((s) => s.resetTimer);
  const tickTimer = useQuizStore((s) => s.tickTimer);

  const [result, setResult] = useState<any>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [showQuestionOverview, setShowQuestionOverview] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerEnabled && isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerEnabled, isTimerRunning, timeRemaining, tickTimer]);

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timerEnabled && timeRemaining === 0 && isTimerRunning) {
      pauseTimer();
      handleSubmit();
    }
  }, [timeRemaining, isTimerRunning, timerEnabled, pauseTimer]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (questions.length > 0 && getAnsweredCount() > 0 && !result) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [questions, answers, result, saveProgress]);

  // Save progress when answers change
  useEffect(() => {
    if (questions.length > 0 && getAnsweredCount() > 0 && !result) {
      saveProgress();
    }
  }, [answers, questions, result, saveProgress]);

  useEffect(() => {
    if (initialQuiz) {
      // Check if there's saved progress for this quiz
      if (hasSavedProgress(initialQuiz.id) && !hasResumed) {
        setShowResumeDialog(true);
        return; // Don't initialize quiz yet, wait for user decision
      }

      // Check if quiz has timer settings, otherwise use defaults
      const timerEnabledFromQuiz = initialQuiz.timerEnabled !== false; // Default true
      const timePerQuestion = initialQuiz.timePerQuestion || 120; // Default 2 minutes

      setQuiz(initialQuiz.id ?? null, initialQuiz.questions ?? [], timerEnabledFromQuiz, timePerQuestion);
    }
  }, [initialQuiz, setQuiz, hasSavedProgress, hasResumed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((currentIndex + 1) / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isTimeWarning = timerEnabled && timeRemaining <= 30; // Warning when less than 30 seconds
  const isTimeCritical = timerEnabled && timeRemaining <= 10; // Critical when less than 10 seconds

  const handleResumeQuiz = () => {
    if (loadProgress(initialQuiz.id)) {
      setHasResumed(true);
      setShowResumeDialog(false);
    }
  };

  const handleStartFresh = () => {
    clearProgress(initialQuiz.id);
    const timerEnabledFromQuiz = initialQuiz.timerEnabled !== false;
    const timePerQuestion = initialQuiz.timePerQuestion || 120;
    setQuiz(initialQuiz.id ?? null, initialQuiz.questions ?? [], timerEnabledFromQuiz, timePerQuestion);
    setHasResumed(true);
    setShowResumeDialog(false);
  };

  const handleSubmit = async () => {
    submitStart();
    try {
      const resp = await fetch(`/api/quiz/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: initialQuiz.id,
          answers,
          totalTimeElapsed
        }),
      });
      const data = await resp.json();
      setResult(data);
      // Clear saved progress after successful submission
      clearProgress(initialQuiz.id);
    } finally {
      submitEnd();
    }
  };

  const handleNext = () => {
    next();
    if (timerEnabled) {
      // Timer will be reset in the next() function
    }
  };

  const handlePrev = () => {
    prev();
    if (timerEnabled) {
      // Timer will be reset in the prev() function
    }
  };

  const jumpToQuestion = (index: number) => {
    // Update current index directly
    useQuizStore.setState({ currentIndex: index });
    setShowQuestionOverview(false);
    if (timerEnabled) {
      // Reset timer for new question
      resetTimer();
    }
  };

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionStatus = (questionId: string, index: number) => {
    const isAnswered = answers[questionId]?.answer !== undefined && answers[questionId]?.answer !== "";
    const isFlagged = flaggedQuestions.has(questionId);
    const isCurrent = index === currentIndex;

    if (isCurrent) return "current";
    if (isFlagged) return "flagged";
    if (isAnswered) return "answered";
    return "unanswered";
  };

  const getQuestionStatusIcon = (status: string) => {
    switch (status) {
      case "current": return <AlertCircle className="h-4 w-4" />;
      case "flagged": return <Flag className="h-4 w-4" />;
      case "answered": return <Check className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case "current": return "bg-blue-500 text-white";
      case "flagged": return "bg-yellow-500 text-white";
      case "answered": return "bg-green-500 text-white";
      default: return "bg-gray-300 text-gray-700";
    }
  };

  const enterReviewMode = () => {
    setReviewMode(true);
    if (isTimerRunning) {
      pauseTimer();
    }
  };

  const exitReviewMode = () => {
    setReviewMode(false);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Resume Dialog
  if (showResumeDialog) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Resume Previous Session?</CardTitle>
            <p className="text-muted-foreground">
              We found an incomplete quiz session for "{initialQuiz.title ?? "this quiz"}".
              Would you like to continue where you left off?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={handleResumeQuiz} className="flex-1">
                Resume Quiz
              </Button>
              <Button onClick={handleStartFresh} variant="outline" className="flex-1">
                Start Fresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Starting fresh will clear your previous progress
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = getAnsweredCount() > 0;

  if (result) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              {initialQuiz.title ?? "Quiz"} • {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {result.score}/{result.max_score}
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round((result.score / result.max_score) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Percentage</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {formatTime(totalTimeElapsed)}
                    </div>
                    <div className="text-sm text-muted-foreground">Time Taken</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {result.results?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.results?.reduce((acc: any, item: any) => {
                          const type = item.type || 'unknown';
                          if (!acc[type]) acc[type] = { correct: 0, total: 0 };
                          acc[type].total++;
                          if (item.score > 0) acc[type].correct++;
                          return acc;
                        }, {}) && Object.entries(
                          result.results?.reduce((acc: any, item: any) => {
                            const type = item.type || 'unknown';
                            if (!acc[type]) acc[type] = { correct: 0, total: 0 };
                            acc[type].total++;
                            if (item.score > 0) acc[type].correct++;
                            return acc;
                          }, {}) || {}
                        ).map(([type, stats]: [string, any]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="capitalize">{type} Questions</span>
                            <Badge variant={stats.correct === stats.total ? "default" : "secondary"}>
                              {stats.correct}/{stats.total}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Questions Answered</span>
                          <span>{result.results?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct Answers</span>
                          <span>{result.results?.filter((r: any) => r.score > 0).length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incorrect Answers</span>
                          <span>{result.results?.filter((r: any) => r.score === 0).length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Time per Question</span>
                          <span>{formatTime(Math.round(totalTimeElapsed / (result.results?.length || 1)))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                <div className="space-y-4">
                  {result.results?.map((item: any, index: number) => {
                    const question = questions[index];
                    const isCorrect = item.score > 0;

                    return (
                      <Card key={index} className={cn(
                        "p-6",
                        isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                      )}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={isCorrect ? "default" : "destructive"}>
                                  Question {index + 1}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {question?.type || 'unknown'}
                                </Badge>
                                <Badge variant={isCorrect ? "default" : "destructive"}>
                                  {item.score}/{item.max_points} points
                                </Badge>
                              </div>
                              <h4 className="font-medium text-lg">{question?.question}</h4>
                            </div>
                          </div>

                          {/* User's Answer */}
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</div>
                            <div className="text-sm">
                              {item.user_answer || <span className="italic text-muted-foreground">No answer provided</span>}
                            </div>
                          </div>

                          {/* Correct Answer (for MCQ/TF) */}
                          {(question?.type === 'mcq' || question?.type === 'tf') && (
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                              <div className="text-sm font-medium text-green-700 mb-1">Correct Answer:</div>
                              <div className="text-sm text-green-800 font-medium">
                                {question.correct_answer}
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          {item.feedback && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <div className="text-sm font-medium text-blue-700 mb-1">Feedback:</div>
                              <div className="text-sm text-blue-800">
                                {item.feedback}
                              </div>
                            </div>
                          )}

                          {/* Rationale */}
                          {question?.rationale && (
                            <div className="bg-purple-50 p-3 rounded border border-purple-200">
                              <div className="text-sm font-medium text-purple-700 mb-1">Explanation:</div>
                              <div className="text-sm text-purple-800">
                                {question.rationale}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review Mode
  if (reviewMode) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Review Your Answers</h1>
              <p className="text-muted-foreground">
                Review all questions before submitting. You can still go back to edit answers.
              </p>
            </div>
            <Button onClick={exitReviewMode} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = answers[question.id]?.answer;
            const isAnswered = userAnswer !== undefined && userAnswer !== "";
            const isFlagged = flaggedQuestions.has(question.id);

            return (
              <Card key={question.id} className={cn(
                "p-6",
                isFlagged && "border-yellow-300 bg-yellow-50/30",
                !isAnswered && "border-gray-300 bg-gray-50/30"
              )}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">
                          Question {index + 1}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {question.type}
                        </Badge>
                        {isFlagged && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        {!isAnswered && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Answered
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-medium leading-relaxed">
                        {question.question}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        jumpToQuestion(index);
                        exitReviewMode();
                      }}
                    >
                      Edit
                    </Button>
                  </div>

                  {/* User's Answer */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</div>
                    <div className="text-sm">
                      {isAnswered ? (
                        <span className="font-medium">{userAnswer}</span>
                      ) : (
                        <span className="italic text-muted-foreground">No answer provided</span>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer (for MCQ/TF) */}
                  {(question.type === 'mcq' || question.type === 'tf') && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-2">Correct Answer:</div>
                      <div className="text-sm text-green-800 font-medium">
                        {question.correct_answer}
                      </div>
                    </div>
                  )}

                  {/* Options for MCQ */}
                  {question.type === 'mcq' && question.options && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">All Options:</div>
                      <div className="grid gap-2">
                        {question.options.map((option: string, optIndex: number) => {
                          const isUserChoice = userAnswer === option;
                          const isCorrect = question.correct_answer === option;

                          return (
                            <div
                              key={optIndex}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                isCorrect && "bg-green-50 border-green-300 text-green-800",
                                isUserChoice && !isCorrect && "bg-red-50 border-red-300 text-red-800",
                                !isUserChoice && !isCorrect && "bg-gray-50 border-gray-200"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  isCorrect && "border-green-500 bg-green-500",
                                  isUserChoice && !isCorrect && "border-red-500 bg-red-500",
                                  !isUserChoice && !isCorrect && "border-gray-300"
                                )}>
                                  {(isCorrect || isUserChoice) && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <span className={cn(
                                  isCorrect && "font-medium",
                                  isUserChoice && !isCorrect && "font-medium"
                                )}>
                                  {option}
                                </span>
                                {isCorrect && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                                {isUserChoice && !isCorrect && <X className="h-4 w-4 text-red-600 ml-auto" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rationale */}
                  {question.rationale && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-700 mb-2">Explanation:</div>
                      <div className="text-sm text-blue-800">
                        {question.rationale}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={exitReviewMode} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Quiz
          </Button>
          <Button
            onClick={() => {
              exitReviewMode();
              handleSubmit();
            }}
            disabled={!canSubmit}
            size="lg"
          >
            Submit Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{initialQuiz.title ?? "Quiz"}</h1>
              <p className="text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showQuestionOverview} onOpenChange={setShowQuestionOverview}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <List className="h-4 w-4 mr-2" />
                    Overview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Question Overview</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                    {questions.map((q, index) => {
                      const status = getQuestionStatus(q.id, index);
                      return (
                        <Button
                          key={q.id}
                          variant={status === "current" ? "default" : "outline"}
                          className={cn(
                            "h-16 flex flex-col items-center justify-center gap-1",
                            getQuestionStatusColor(status)
                          )}
                          onClick={() => jumpToQuestion(index)}
                        >
                          {getQuestionStatusIcon(status)}
                          <span className="text-xs">{index + 1}</span>
                          {flaggedQuestions.has(q.id) && (
                            <Flag className="h-3 w-3 absolute top-1 right-1" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Flagged</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-300 rounded"></div>
                      <span>Unanswered</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFlagQuestion(q.id)}
                className={cn(
                  flaggedQuestions.has(q.id) && "bg-yellow-100 border-yellow-300"
                )}
              >
                <Flag className={cn(
                  "h-4 w-4",
                  flaggedQuestions.has(q.id) && "fill-yellow-500 text-yellow-600"
                )} />
              </Button>
            </div>
          </div>

          {/* Timer */}
          {timerEnabled && (
            <Card className={cn(
              "p-4 min-w-[200px]",
              isTimeCritical && "border-red-500 bg-red-50",
              isTimeWarning && !isTimeCritical && "border-yellow-500 bg-yellow-50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Time Left</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isTimerRunning ? pauseTimer : startTimer}
                    disabled={timeRemaining === 0}
                  >
                    {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetTimer}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-center mt-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(timeRemaining / (initialQuiz.timePerQuestion || 120)) * 100}%` }}
                ></div>
              </div>
            </Card>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{getAnsweredCount()} of {questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <QuestionCard
            question={q}
            value={answers[q.id]?.answer}
            onChange={(val) => setAnswer(q.id, val)}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isLastQuestion}
          >
            Next
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={enterReviewMode}
            disabled={getAnsweredCount() === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Review Answers
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="sm:w-auto w-full"
          >
            {isLastQuestion ? "Submit Quiz" : "Submit Early"}
          </Button>
        </div>
      </div>
    </div>
  );
}
