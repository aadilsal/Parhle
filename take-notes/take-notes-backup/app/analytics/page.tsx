"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Calendar,
  Trophy,
  RefreshCw
} from "lucide-react";
import dynamic from "next/dynamic";

const QuizCharts = dynamic(() => import("@/components/analytics/quiz-charts"), {
  ssr: false,
});
import { toast } from "sonner";

interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  recentAttempts: any[];
  scoreTrend: any[];
  performanceByTopic: any[];
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  recentUploads: any[];
  filesByCategory: any[];
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Load quiz statistics
      const quizRes = await fetch("/api/analytics/quiz-stats");
      const quizData = await quizRes.json();

      // Load file statistics
      const fileRes = await fetch("/api/analytics/file-stats");
      const fileData = await fileRes.json();

      if (quizRes.ok) setStats(quizData);
      if (fileRes.ok) setFileStats(fileData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatScore = (score: number) => `${Math.round(score)}%`;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your learning progress and quiz performance
            </p>
          </div>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Performance</TabsTrigger>
          <TabsTrigger value="files">File Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalQuizzes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalAttempts || 0} attempts made
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageScore ? formatScore(stats.averageScore) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best: {stats?.bestScore ? formatScore(stats.bestScore) : "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fileStats?.totalFiles || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {fileStats?.totalSize ? `${Math.round(fileStats.totalSize / 1024)} KB` : "0 KB"} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  days in a row
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Quiz Attempts
                </CardTitle>
                <CardDescription>Your latest quiz activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {stats?.recentAttempts?.length ? (
                    <div className="space-y-3">
                      {stats.recentAttempts.map((attempt: any) => (
                        <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{attempt.quiz_title || "Quiz"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(attempt.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={attempt.score / attempt.max_score >= 0.7 ? "default" : "secondary"}>
                              {formatScore((attempt.score / attempt.max_score) * 100)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(attempt.total_time_elapsed || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quiz attempts yet</p>
                      <p className="text-sm">Take your first quiz to see activity here</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent File Uploads
                </CardTitle>
                <CardDescription>Your latest uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {fileStats?.recentUploads?.length ? (
                    <div className="space-y-3">
                      {fileStats.recentUploads.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium truncate">{file.title || "Untitled"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "N/A"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No files uploaded yet</p>
                      <p className="text-sm">Upload your first document to see it here</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance Analytics</CardTitle>
              <CardDescription>Detailed analysis of your quiz performance</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizCharts stats={stats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Management</CardTitle>
              <CardDescription>Manage your uploaded documents and notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">File Management Coming Soon</p>
                <p>Advanced file organization and analytics features</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}