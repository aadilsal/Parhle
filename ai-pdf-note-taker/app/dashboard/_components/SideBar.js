"use client";
import Image from "next/image";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Progress } from "../../../components/ui/progress";
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  BookOpen,
  Sparkles
} from "lucide-react";

const SideBar = () => {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Get user's PDFs count
  const pdfFiles = useQuery(
    api.pdfFiles.getUserPdfFiles,
    userEmail ? { userEmail } : "skip"
  );

  // Get user's total messages (study activity)
  const allMessages = useQuery(
    api.chatMessages.getUserMessages,
    userEmail ? { userEmail } : "skip"
  );

  const totalPdfs = pdfFiles?.length || 0;
  const totalQuestions = allMessages?.filter(m => m.role === "user").length || 0;
  const totalAnswers = allMessages?.filter(m => m.role === "assistant").length || 0;

  return (
    <div className="shadow-sm h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <Image
          src={"/logo.jpg"}
          width={120}
          height={40}
          alt="logo"
          className="object-contain"
          priority
        />
        <p className="text-xs text-gray-500 mt-2">AI Study Assistant</p>
      </div>

      {/* User Stats */}
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your Activity</p>
              <p className="text-sm font-semibold text-gray-900">Keep Learning!</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">PDFs</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{totalPdfs}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Questions</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{totalQuestions}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">AI Responses</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{totalAnswers}</span>
            </div>
          </div>
        </div>

        {/* Study Streak (if there's activity) */}
        {totalQuestions > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <p className="text-sm font-semibold text-gray-900">Learning Progress</p>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              You've asked {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} so far!
            </p>
            <div className="flex items-center gap-2">
              <Progress value={Math.min((totalQuestions / 50) * 100, 100)} className="h-2" />
              <span className="text-xs text-gray-500">{Math.min(totalQuestions, 50)}/50</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalQuestions < 50 ? `${50 - totalQuestions} more to reach milestone!` : "Milestone reached! 🎉"}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Free Version Message */}
      <div className="mt-auto p-6 border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">🎉 Free Forever</p>
          <p className="text-xs text-gray-600 mt-1">
            Unlimited PDFs & Conversations
          </p>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
