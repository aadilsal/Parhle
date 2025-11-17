"use client";

import { create } from "zustand";

export type QuizQuestion = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correct_answer?: string | null;
  rationale?: string;
};

type QuizState = {
  quizId: string | null;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, any>;
  isSubmitting: boolean;

  // Timer functionality
  timerEnabled: boolean;
  timePerQuestion: number; // in seconds
  timeRemaining: number; // in seconds
  totalTimeElapsed: number; // in seconds
  isTimerRunning: boolean;

  setQuiz: (quizId: string | null, questions?: QuizQuestion[], timerEnabled?: boolean, timePerQuestion?: number) => void;
  setAnswer: (questionId: string, answer: any) => void;
  next: () => void;
  prev: () => void;
  submitStart: () => void;
  submitEnd: () => void;

  // Timer methods
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setTimerEnabled: (enabled: boolean) => void;
  setTimePerQuestion: (seconds: number) => void;

  // Resume functionality
  saveProgress: () => void;
  loadProgress: (quizId: string) => boolean;
  clearProgress: (quizId: string) => void;
  hasSavedProgress: (quizId: string) => boolean;
};

export const useQuizStore = create<QuizState>((set, get) => ({
  quizId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  isSubmitting: false,

  // Timer defaults
  timerEnabled: true,
  timePerQuestion: 120, // 2 minutes per question
  timeRemaining: 120,
  totalTimeElapsed: 0,
  isTimerRunning: false,

  setQuiz(quizId, questions, timerEnabled = true, timePerQuestion = 120) {
    set({
      quizId,
      questions: questions ?? [],
      currentIndex: 0,
      answers: {},
      timerEnabled,
      timePerQuestion,
      timeRemaining: timePerQuestion,
      totalTimeElapsed: 0,
      isTimerRunning: false
    });
  },

  setAnswer(questionId, answer) {
    set((state) => ({ answers: { ...state.answers, [questionId]: { answer } } }));
  },

  next() {
    set((state) => {
      const nextIndex = Math.min(state.currentIndex + 1, state.questions.length - 1);
      const newTimeRemaining = state.timerEnabled ? state.timePerQuestion : state.timeRemaining;

      return {
        currentIndex: nextIndex,
        timeRemaining: newTimeRemaining,
        isTimerRunning: false // Pause timer when moving to next question
      };
    });
  },

  prev() {
    set((state) => {
      const prevIndex = Math.max(state.currentIndex - 1, 0);
      const newTimeRemaining = state.timerEnabled ? state.timePerQuestion : state.timeRemaining;

      return {
        currentIndex: prevIndex,
        timeRemaining: newTimeRemaining,
        isTimerRunning: false // Pause timer when moving to previous question
      };
    });
  },

  startTimer() {
    set({ isTimerRunning: true });
  },

  pauseTimer() {
    set({ isTimerRunning: false });
  },

  resetTimer() {
    set((state) => ({
      timeRemaining: state.timePerQuestion,
      totalTimeElapsed: 0,
      isTimerRunning: false
    }));
  },

  tickTimer() {
    set((state) => {
      if (!state.isTimerRunning || state.timeRemaining <= 0) {
        return { isTimerRunning: false };
      }

      return {
        timeRemaining: state.timeRemaining - 1,
        totalTimeElapsed: state.totalTimeElapsed + 1
      };
    });
  },

  setTimerEnabled(enabled: boolean) {
    set({ timerEnabled: enabled });
  },

  setTimePerQuestion(seconds: number) {
    set((state) => ({
      timePerQuestion: seconds,
      timeRemaining: seconds
    }));
  },

  submitStart() {
    set({ isSubmitting: true, isTimerRunning: false });
  },

  submitEnd() {
    set({ isSubmitting: false });
  },

  // Resume functionality
  saveProgress() {
    const state = get();
    if (!state.quizId) return;

    const progressData = {
      quizId: state.quizId,
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: state.answers,
      timerEnabled: state.timerEnabled,
      timePerQuestion: state.timePerQuestion,
      timeRemaining: state.timeRemaining,
      totalTimeElapsed: state.totalTimeElapsed,
      isTimerRunning: state.isTimerRunning,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem(`quiz-progress-${state.quizId}`, JSON.stringify(progressData));
    } catch (error) {
      console.warn('Failed to save quiz progress:', error);
    }
  },

  loadProgress(quizId: string): boolean {
    try {
      const savedData = localStorage.getItem(`quiz-progress-${quizId}`);
      if (!savedData) return false;

      const progressData = JSON.parse(savedData);

      // Check if progress is not too old (24 hours)
      const isExpired = Date.now() - progressData.savedAt > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(`quiz-progress-${quizId}`);
        return false;
      }

      set({
        quizId: progressData.quizId,
        questions: progressData.questions,
        currentIndex: progressData.currentIndex,
        answers: progressData.answers,
        timerEnabled: progressData.timerEnabled,
        timePerQuestion: progressData.timePerQuestion,
        timeRemaining: progressData.timeRemaining,
        totalTimeElapsed: progressData.totalTimeElapsed,
        isTimerRunning: false, // Don't auto-start timer on resume
        isSubmitting: false
      });

      return true;
    } catch (error) {
      console.warn('Failed to load quiz progress:', error);
      return false;
    }
  },

  clearProgress(quizId: string) {
    try {
      localStorage.removeItem(`quiz-progress-${quizId}`);
    } catch (error) {
      console.warn('Failed to clear quiz progress:', error);
    }
  },

  hasSavedProgress(quizId: string): boolean {
    try {
      const savedData = localStorage.getItem(`quiz-progress-${quizId}`);
      if (!savedData) return false;

      const progressData = JSON.parse(savedData);
      const isExpired = Date.now() - progressData.savedAt > 24 * 60 * 60 * 1000;

      if (isExpired) {
        localStorage.removeItem(`quiz-progress-${quizId}`);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },
}));
