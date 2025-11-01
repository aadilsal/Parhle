"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Star,
  Trash2,
  Share,
  Users,
  Clock,
  Wifi,
  WifiOff,
  MoreHorizontal,
  Info,
  Link2,
  Eye,
  Edit3,
  PanelRightOpen,
} from "lucide-react";
import type { Note, Category } from "@/types";
import { useNotesStore } from "@/hooks/use-notes-store";
import { SimpleTagInput } from "@/components/dashboard/simple-tag-input";
// AI menu replaced by Chat button (chat dialog will expose AI tools)
import { KeyboardShortcutsDialog } from "@/components/dashboard/keyboard-shortcuts-dialog";
import { FeatureNotReadyDialog } from "@/components/dashboard/feature-not-ready-dialog";
import { CategorySelect } from "@/components/dashboard/category-select";
import { RelatedNotes } from "@/components/dashboard/related-notes";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/use-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { TagDisplay } from "./tag-display";
import { AIToolsMenu } from "./ai-tools-menu";

interface NoteEditorProps {
  note: Note | null;
  categories: Category[];
  onBackToList?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function NoteEditor({
  note,
  categories,
  onBackToList,
  showBackButton,
  className,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [featureDialog, setFeatureDialog] = useState<string | null>(null);
  const [isOnline] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showRelatedNotes, setShowRelatedNotes] = useState(false);

  const { updateNote, toggleFavorite, deleteNote, createCategory } =
    useNotesStore();
  const {
    summarizeText,
    rephraseText,
    translateText,
    generateTemplate,
    generateTags,
    isLoading,
  } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (note) {
      console.log("[note-editor] loading note into editor", note.id, "title:", note.title);
      setTitle(note.title || "");
      setContent(note.content || "");
      console.log("[note-editor] note content length", note.content ? note.content.length : 0);
      setCategoryId(note.categoryId || "");
      setTags(note.tags || []);
      setHasUnsavedChanges(false);
      setLastSaved(note.updatedAt ? new Date(note.updatedAt) : null);
      // If the note was created by the PDF importer we log it, but do not
      // open the inline chat automatically — revert to editor-only for now.
      try {
        const isImported = Boolean(note.content && note.content.startsWith("Imported PDF:"));
        console.log("[note-editor] imported PDF note detected (chat disabled):", { noteId: note.id, isImported });
      } catch (e) {
        // ignore
      }
    }
  }, [note]);

  const handleSave = useCallback(async () => {
    if (note && hasUnsavedChanges) {
      updateNote(note.id, {
        title: title || "Untitled",
        content,
        categoryId: categoryId || undefined,
        tags,
      });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    }
  }, [note, title, content, categoryId, tags, hasUnsavedChanges, updateNote]);

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges && isOnline) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, handleSave, isOnline]);

  // Log when a note is an imported PDF so we can trace why inline chat is rendered
  useEffect(() => {
    if (content && content.startsWith("Imported PDF:")) {
      console.log("[note-editor] content indicates imported PDF — inline chat will render", { noteId: note?.id });
    }
  }, [content, note?.id]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setHasUnsavedChanges(true);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setHasUnsavedChanges(true);
  };

  // AI Functions (simulated)
  const handleAISummarize = async () => {
    if (!content) return;
    const summary = await summarizeText(content, note?.id);
    if (summary) {
      handleContentChange(content + "\n\n## Summary\n" + summary);
    }
  };

  const handleAIRephrase = async (
    style: "formal" | "informal" | "concise" | "extended"
  ) => {
    if (!content) return;
    const rephrased = await rephraseText(content, style, note?.id);
    if (rephrased) {
      handleContentChange(rephrased);
    }
  };

  const handleAITranslate = async (language: string) => {
    if (!content) return;
    const translated = await translateText(content, language, note?.id);
    if (translated) {
      handleContentChange(translated);
    }
  };

  const handleGenerateTemplate = async (
    type: "meeting" | "project" | "daily" | "research"
  ) => {
    const template = await generateTemplate(type, note?.id);
    if (template) {
      handleContentChange(template);
    }
  };

  const handleGenerateTags = async () => {
    if (!content) return;
    const suggestedTags = await generateTags(content, note?.id);
    if (suggestedTags && Array.isArray(suggestedTags)) {
      const newTags = [...new Set([...tags, ...suggestedTags])];
      handleTagsChange(newTags);
    }
  };

  const handleToggleFavorite = () => {
    if (note) {
      toggleFavorite(note.id);
    }
  };

  const handleDeleteNote = () => {
    if (note) {
      deleteNote(note.id);
      if (onBackToList) {
        onBackToList();
      }
    }
  };

  const renderPreview = () => {
    return (
      <div
        className="prose prose-sm max-w-none p-4"
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        <h1 className="text-2xl font-bold mb-4">{title || "Untitled"}</h1>
        {/* If the content was created by the PDF importer, hide the Imported PDF statement
            and render the AI chat inline in its place. */}
        {/* Render the note content. If it was an imported PDF, strip the
            leading `Imported PDF:` marker and show the extracted text. Chat
            UI is currently disabled; revert to editor-only presentation. */}
        {(() => {
          const display = content && content.startsWith("Imported PDF:")
            ? content.replace(/^Imported PDF:\s*/i, "")
            : (content || "No content")
          return (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {display}
            </ReactMarkdown>
          )
        })()}
      </div>
    );
  };

  if (!note) {
    return (
      <div
        className={cn(
          "h-full flex items-center justify-center text-muted-foreground bg-muted/10",
          className
        )}
      >
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto opacity-50" />
          <div>
            <p className="font-medium">Select a note to start editing</p>
            <p className="text-sm text-muted-foreground/70">
              Choose from your notes or create a new one
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Editor Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="p-3 lg:p-4 space-y-3">
          {/* Status and Actions Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className="hidden sm:inline">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    Saved{" "}
                    {lastSaved.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  Unsaved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="h-6 w-6 p-0"
              >
                {isPreviewMode ? (
                  <Edit3 className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRelatedNotes(!showRelatedNotes)}
                  className="h-6 w-6 p-0"
                >
                  <PanelRightOpen className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                className="h-6 w-6 p-0"
              >
                <Info className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className="h-6 w-6 p-0"
              >
                <Star
                  className={cn(
                    "h-3 w-3",
                    note.isFavorite && "fill-yellow-400 text-yellow-400"
                  )}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setFeatureDialog("collaboration")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Collaborate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFeatureDialog("share")}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Note
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFeatureDialog("copy link")}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteNote}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title */}
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg lg:text-xl font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
          />

          {/* Metadata and Tools */}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 sm:items-center">
            <CategorySelect
              categories={categories}
              value={categoryId}
              onValueChange={handleCategoryChange}
              onCreateCategory={createCategory}
            />

            <div className="flex-1 min-w-0">
              {isPreviewMode ? (
                <TagDisplay
                  tags={tags}
                  isPreview={true}
                  maxPreviewTags={3}
                  className="mt-1"
                />
              ) : (
                <SimpleTagInput
                  tags={tags}
                  onChange={handleTagsChange}
                  placeholder="Add tags..."
                />
              )}
            </div>

            {/* AI tools (dropdown) — chat is disabled but AI actions should remain available */}
            <div className="flex items-center gap-2">
              <AIToolsMenu
                onSummarize={handleAISummarize}
                onRephrase={handleAIRephrase}
                onTranslate={handleAITranslate}
                onGenerateTemplate={handleGenerateTemplate}
                onGenerateTags={handleGenerateTags}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {isPreviewMode ? (
            <div className="h-full overflow-auto">{renderPreview()}</div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing here..."
              className="w-full h-full resize-none border-0 focus-visible:ring-0 bg-transparent text-sm leading-relaxed p-4"
            />
          )}
        </div>

        {/* Related Notes Sidebar - Desktop only */}
        {showRelatedNotes && !isMobile && (
          <div className="w-64 xl:w-80 border-l">
            <RelatedNotes noteId={note.id} content={content} />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />

      <FeatureNotReadyDialog
        open={!!featureDialog}
        onOpenChange={() => setFeatureDialog(null)}
        feature={featureDialog || ""}
      />

    {/* Chat dialog (opened via Chat button in the header) - removed duplicate fullPage render
      Chat is rendered inline in the editor area when `chatOpen` is true. */}
    </div>
  );
}
