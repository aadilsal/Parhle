"use client";

import { useState, useEffect } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/types";
import { useNotesStore } from "@/hooks/use-notes-store";
import { cn } from "@/lib/utils";

interface RelatedNotesProps {
  noteId: string;
  content: string;
  className?: string;
}

export function RelatedNotes({
  noteId,
  content,
  className,
}: RelatedNotesProps) {
  const { notes, setSelectedNote } = useNotesStore();
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Simple algorithm to find related notes based on common words and tags
    const currentNote = notes.find((n) => n.id === noteId);
    if (!currentNote) return;

    const contentWords = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const currentTags = currentNote.tags || [];

    const scored = notes
      .filter((note) => note.id !== noteId && !note.deletedAt)
      .map((note) => {
        let score = 0;

        // Score based on common tags
        const commonTags = (note.tags || []).filter((tag) =>
          currentTags.some(
            (currentTag) => currentTag.toLowerCase() === tag.toLowerCase()
          )
        );
        score += commonTags.length * 3;

        // Score based on common words in content
        const noteContent = (note.content || "").toLowerCase();
        const commonWords = contentWords.filter((word) =>
          noteContent.includes(word)
        );
        score += commonWords.length * 0.5;

        // Score based on same category
        if (note.categoryId === currentNote.categoryId && note.categoryId) {
          score += 2;
        }

        return { note, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.note);

    setRelatedNotes(scored);
  }, [noteId, content, notes]);

  if (relatedNotes.length === 0) {
    return (
      <div className={cn("h-full flex flex-col bg-muted/10", className)}>
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm">Related Notes</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div className="text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No related notes found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-muted/10", className)}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Related Notes</h3>
          <Badge variant="secondary" className="text-xs">
            {relatedNotes.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {relatedNotes.map((note) => (
            <div
              key={note.id}
              className="p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors group"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs truncate mb-1">
                    {note.title || "Untitled"}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {note.content?.replace(/[#*`]/g, "").substring(0, 80) ||
                      "No content"}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
