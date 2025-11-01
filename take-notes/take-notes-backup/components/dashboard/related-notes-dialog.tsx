"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import type { Note } from "@/types";
import { useNotesStore } from "@/hooks/use-notes-store";

interface RelatedNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  content: string;
}

export function RelatedNotesDialog({
  open,
  onOpenChange,
  noteId,
  content,
}: RelatedNotesDialogProps) {
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
      .slice(0, 8)
      .map((item) => item.note);

    setRelatedNotes(scored);
  }, [noteId, content, notes]);

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Related Notes
            {relatedNotes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {relatedNotes.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {relatedNotes.length === 0 ? (
          <div className="flex items-center justify-center text-center p-8">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No related notes found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Related notes are found based on common tags and content
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {relatedNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group border"
                  onClick={() => handleNoteSelect(note)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {note.title || "Untitled"}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                        {note.content
                          ?.replace(/[#*`]/g, "")
                          .substring(0, 100) || "No content"}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
