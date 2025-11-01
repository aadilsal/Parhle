"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);

  const callAI = async (endpoint: string, data: any) => {
    setIsLoading(true);
    const toastId = toast.loading("Processing...");
    try {
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI request failed");
      }

      const result = await response.json();
      toast.dismiss(toastId);
      return result.result;
    } catch (error: any) {
      toast.dismiss(toastId);
      toast("Failed to process AI request");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeText = async (text: string, noteId?: string) => {
    return callAI("summarize", { text, noteId });
  };

  const rephraseText = async (
    text: string,
    style: "formal" | "informal" | "concise" | "extended",
    noteId?: string
  ) => {
    return callAI("rephrase", { text, style, noteId });
  };

  const translateText = async (
    text: string,
    language: string,
    noteId?: string
  ) => {
    return callAI("translate", { text, language, noteId });
  };

  const generateTemplate = async (
    type: "meeting" | "project" | "daily" | "research",
    noteId?: string
  ) => {
    return callAI("template", { type, noteId });
  };

  const generateTags = async (content: string, noteId?: string) => {
    return callAI("generate-tags", { content, noteId });
  };

  const findRelatedNotes = async (content: string, excludeNoteId: string) => {
    return callAI("related-notes", { content, excludeNoteId });
  };

  return {
    summarizeText,
    rephraseText,
    translateText,
    generateTemplate,
    generateTags,
    findRelatedNotes,
    isLoading,
  };
}
