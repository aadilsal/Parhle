"use client";
import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import UploadPdfDialog from "./_components/UploadPdfDialog";
import PdfList from "./_components/PdfList";
import PdfViewer from "./_components/PdfViewer";
import ChatInterface from "./_components/ChatInterface";
import SemanticSearchPanel from "./_components/SemanticSearchPanel";
import { Upload, MessageSquare, Search, FileText } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Dashboard = () => {
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // chat, search, viewer

  // Get selected file details
  const selectedFile = useQuery(
    api.pdfFiles.getPdfFile,
    selectedFileId ? { fileID: selectedFileId } : "skip"
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI PDF Note Taker</h1>
          <p className="text-sm text-gray-600">Chat with your PDFs using AI</p>
        </div>
        <UploadPdfDialog>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </UploadPdfDialog>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - PDF List */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Your PDFs</h2>
            <p className="text-xs text-gray-500 mt-1">
              Select a PDF to start chatting
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <PdfList
              selectedFileId={selectedFileId}
              onSelectFile={setSelectedFileId}
            />
          </div>
        </div>

        {/* Center - Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          {selectedFileId && (
            <div className="bg-white border-b px-4 flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "search"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Search
              </button>
              <button
                onClick={() => setActiveTab("viewer")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "viewer"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                View PDF
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <ChatInterface
                fileID={selectedFileId}
                fileName={selectedFile?.fileName}
              />
            )}
            {activeTab === "search" && (
              <SemanticSearchPanel
                fileID={selectedFileId}
                fileName={selectedFile?.fileName}
              />
            )}
            {activeTab === "viewer" && <PdfViewer fileID={selectedFileId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
