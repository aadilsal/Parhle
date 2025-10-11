"use client";
import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader2, Send, Bot, User, FileText, Trash2, Download } from "lucide-react";

const ChatInterface = ({ fileID, fileName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  const chatWithPdf = useAction(api.myActions.chatWithPdf);
  const saveMessage = useMutation(api.chatMessages.saveMessage);
  const clearMessages = useMutation(api.chatMessages.clearFileMessages);
  
  // Load conversation history from database
  const conversationHistory = useQuery(
    api.chatMessages.getFileMessages,
    fileID && userEmail ? { fileID, userEmail } : "skip"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history from database when file or history changes
  useEffect(() => {
    if (conversationHistory) {
      setIsLoadingHistory(false);
      if (conversationHistory.length > 0) {
        // Convert database format to component format
        const loadedMessages = conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          sources: msg.sources,
          contextUsed: msg.contextUsed,
        }));
        setMessages(loadedMessages);
      } else if (fileID) {
        // No history, show welcome message
        setMessages([
          {
            role: "assistant",
            content: `Hi! I'm your AI study assistant. I'm ready to help you learn from "${fileName}". 

I can:
📚 Answer questions about the content
💡 Explain concepts step-by-step
📝 Summarize key points
🔍 Find specific information

What would you like to know?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [conversationHistory, fileID, fileName]);

  // Reset when file changes
  useEffect(() => {
    setIsLoadingHistory(true);
    if (!fileID) {
      setMessages([]);
    }
  }, [fileID]);
  
  const handleClearChat = async () => {
    if (!fileID || !userEmail) return;
    
    if (confirm("Are you sure you want to clear this conversation? This cannot be undone.")) {
      try {
        await clearMessages({ fileID, userEmail });
        setMessages([
          {
            role: "assistant",
            content: `Conversation cleared. How can I help you with "${fileName}"?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error("Error clearing messages:", error);
      }
    }
  };

  const handleExportChat = () => {
    const chatText = messages.map((msg) => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const role = msg.role === "user" ? "You" : "AI Assistant";
      return `[${timestamp}] ${role}:\n${msg.content}\n`;
    }).join("\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${fileName}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !userEmail) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to database
      await saveMessage({
        fileID,
        userEmail,
        role: "user",
        content: userMessage.content,
      });

      // Build conversation history (excluding the current message)
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await chatWithPdf({
        question: userMessage.content,
        fileID: fileID || undefined,
        conversationHistory: history,
      });

      if (result.success) {
        const assistantMessage = {
          role: "assistant",
          content: result.answer,
          timestamp: new Date().toISOString(),
          sources: result.sources,
          contextUsed: result.contextUsed,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Save assistant message to database
        await saveMessage({
          fileID,
          userEmail,
          role: "assistant",
          content: result.answer,
          contextUsed: result.contextUsed,
          sources: result.sources,
        });
      } else {
        const errorMessage = {
          role: "assistant",
          content: `Sorry, I encountered an error: ${result.error}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!fileID) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 mb-2">No PDF selected</p>
          <p className="text-xs text-gray-500">
            Select a PDF to start your learning session
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-sm">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">AI Study Assistant</h3>
              <p className="text-xs text-gray-600 truncate max-w-xs">
                📚 Studying: {fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              disabled={messages.length <= 1}
              className="text-xs"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length <= 1}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : message.isError
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    📚 Sources: {message.contextUsed} relevant chunks used
                  </p>
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Study Prompts */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-3 bg-gradient-to-br from-blue-50 to-purple-50">
          <p className="text-xs font-semibold text-gray-700 mb-2">📚 Quick Study Commands:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setInput("What are the main concepts in this document?")}
              className="text-xs bg-white hover:bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-left transition-colors"
            >
              📖 Main Concepts
            </button>
            <button
              onClick={() => setInput("Can you summarize this document?")}
              className="text-xs bg-white hover:bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-left transition-colors"
            >
              📝 Summarize
            </button>
            <button
              onClick={() => setInput("What are the key takeaways?")}
              className="text-xs bg-white hover:bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-left transition-colors"
            >
              🎯 Key Takeaways
            </button>
            <button
              onClick={() => setInput("Explain the most important topics step-by-step")}
              className="text-xs bg-white hover:bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-left transition-colors"
            >
              📚 Detailed Explanation
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask a question to learn more..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            💡 Ask specific questions, request explanations, or ask for summaries
          </p>
          {messages.length > 1 && (
            <p className="text-xs text-blue-600">
              📝 {messages.filter(m => m.role === "user").length} questions asked
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
