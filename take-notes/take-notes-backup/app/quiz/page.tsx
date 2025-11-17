"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  category_id: string | null;
  tags: any;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function QuizHome() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizTitle, setQuizTitle] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(120); // 2 minutes default
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const router = useRouter();

  // Load notes and categories
  useEffect(() => {
    loadNotesAndCategories();
  }, []);

  const loadNotesAndCategories = async () => {
    try {
      const supabase = createClient();

      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("id, title, content, category_id, tags, created_at")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (notesError) throw notesError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;

      setNotes(notesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load notes and categories");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Filter notes based on selected category
  const filteredNotes = selectedCategory === "all"
    ? notes
    : notes.filter(note => note.category_id === selectedCategory);

  const handleNoteToggle = (noteId: string) => {
    setSelectedNoteIds(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSelectAllInCategory = () => {
    const categoryNoteIds = filteredNotes.map(note => note.id);
    setSelectedNoteIds(prev => {
      const newSelection = [...new Set([...prev, ...categoryNoteIds])];
      return newSelection;
    });
  };

  const handleDeselectAll = () => {
    setSelectedNoteIds([]);
  };

  async function handleGenerate() {
    if (selectedNoteIds.length === 0) {
      toast.error("Please select at least one note");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/quiz/generate-from-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteIds: selectedNoteIds,
          difficulty,
          numQuestions,
          title: quizTitle.trim() || undefined,
          timerEnabled,
          timePerQuestion
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      if (data?.quizId) {
        toast.success("Quiz generated successfully!");
        router.push(`/quiz/${data.quizId}`);
      } else {
        throw new Error("No quiz ID returned");
      }
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingNotes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Generate Quiz from Notes
        </h1>
        <p className="text-muted-foreground">
          Select the notes you want to create a quiz from. The quiz will be generated based on the content of your selected notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Notes</CardTitle>
                  <CardDescription>
                    Choose the notes to generate questions from
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllInCategory}
                    disabled={filteredNotes.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedNoteIds.length === 0}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="category-filter">Filter by category:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notes found in this category</p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={note.id}
                          checked={selectedNoteIds.includes(note.id)}
                          onCheckedChange={() => handleNoteToggle(note.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={note.id}
                            className="font-medium cursor-pointer block"
                          >
                            {note.title || "Untitled Note"}
                          </label>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {note.content || "No content"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {note.tags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{note.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedNoteIds.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedNoteIds.length} note{selectedNoteIds.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quiz Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>
                Configure your quiz parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quiz-title">Quiz Title (Optional)</Label>
                <Input
                  id="quiz-title"
                  placeholder="My Custom Quiz"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="num-questions">Number of Questions</Label>
                <Input
                  id="num-questions"
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timer-enabled"
                    checked={timerEnabled}
                    onCheckedChange={(checked: boolean) => setTimerEnabled(checked)}
                  />
                  <Label htmlFor="timer-enabled">Enable Timer</Label>
                </div>

                {timerEnabled && (
                  <div>
                    <Label htmlFor="time-per-question">Time per Question (seconds)</Label>
                    <Input
                      id="time-per-question"
                      type="number"
                      min={30}
                      max={3600}
                      value={timePerQuestion}
                      onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: 120 seconds (2 minutes) per question
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={selectedNoteIds.length === 0 || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
