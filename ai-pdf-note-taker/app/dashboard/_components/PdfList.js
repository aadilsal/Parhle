"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "../../../components/ui/button";
import { FileText, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "../../../components/ui/toast";

const PdfList = ({ selectedFileId, onSelectFile }) => {
  const { user } = useUser();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState(null);

  // Fetch user's PDF files
  const pdfFiles = useQuery(
    api.pdfFiles.getUserPdfFiles,
    user?.primaryEmailAddress?.emailAddress
      ? { userEmail: user.primaryEmailAddress.emailAddress }
      : "skip"
  );

  const deletePdf = useMutation(api.pdfFiles.deletePdfFile);

  const handleDelete = async (fileID, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This will also delete all associated embeddings.`)) {
      return;
    }

    setDeletingId(fileID);
    try {
      const result = await deletePdf({ fileID });
      toast.push({
        title: "Deleted successfully",
        description: `Removed ${fileName} and ${result.deleted.documents} embeddings`,
        variant: "success",
      });
      
      // If we deleted the selected file, clear selection
      if (selectedFileId === fileID) {
        onSelectFile(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.push({
        title: "Delete failed",
        description: error.message || "Could not delete file",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!pdfFiles) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading files...</p>
        </div>
      </div>
    );
  }

  if (pdfFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 mb-2">No PDFs uploaded yet</p>
          <p className="text-xs text-gray-500">Upload your first PDF to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2 p-2">
        {pdfFiles.map((file) => {
          const isSelected = selectedFileId === file.fileID;
          const isDeleting = deletingId === file.fileID;

          return (
            <div
              key={file._id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected 
                  ? "bg-blue-50 border-blue-300 shadow-sm" 
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }
                ${isDeleting ? "opacity-50 pointer-events-none" : ""}
              `}
              onClick={() => onSelectFile(file.fileID)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <FileText className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {file.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(file._creationTime)}
                  </p>
                  
                  {/* Processing status indicator */}
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-600">Ready</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.fileID, file.fileName);
                  }}
                  disabled={isDeleting}
                  className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PdfList;
