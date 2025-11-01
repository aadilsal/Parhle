"use client";

import type React from "react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  Trash2,
  MoreHorizontal,
  FileText,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/types";
import { useNotesStore } from "@/hooks/use-notes-store";
import { cn } from "@/lib/utils";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onNoteSelect: (note: Note) => void;
  isLoading?: boolean;
  className?: string;
}

export function NotesList({
  notes,
  selectedNote,
  onNoteSelect,
  isLoading = false,
  className,
}: NotesListProps) {
  const { toggleFavorite, deleteNote, duplicateNote } = useNotesStore();
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);

  const handleToggleFavorite = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    toggleFavorite(noteId);
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    deleteNote(noteId);
  };

  const handleDuplicateNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    duplicateNote(noteId);
  };

  const handleDragStart = (e: React.DragEvent, note: Note) => {
    setDraggedNote(note);
    e.dataTransfer.setData("text/plain", note.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetNote: Note) => {
    e.preventDefault();
    if (draggedNote && draggedNote.id !== targetNote.id) {
      console.log("Reorder notes:", draggedNote.id, "->", targetNote.id);
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-muted/10", className)}>
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Notes</h2>
          <Badge variant="secondary" className="text-xs">
            {notes.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p className="font-medium">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No notes found</p>
              <p className="text-sm text-muted-foreground/70">
                Create your first note to get started
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                draggable
                onDragStart={(e) => handleDragStart(e, note)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, note)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-all duration-200 group border border-transparent",
                  selectedNote?.id === note.id &&
                    "bg-accent border-accent-foreground/20 shadow-sm",
                  draggedNote?.id === note.id && "opacity-50"
                )}
                onClick={() => onNoteSelect(note)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {note.title || "Untitled"}
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {note.content?.replace(/[#*`]/g, "") || "No content"}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">
                          {formatDistanceToNow(new Date(note.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-4"
                          >
                            {note.tags[0]}
                            {note.tags.length > 1 &&
                              ` +${note.tags.length - 1}`}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => handleToggleFavorite(e, note.id)}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          note.isFavorite && "fill-yellow-400 text-yellow-400"
                        )}
                      />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleDuplicateNote(e, note.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteNote(e, note.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
