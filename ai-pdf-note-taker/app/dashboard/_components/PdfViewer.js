"use client";
import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, FileText, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "../../../components/ui/button";

const PdfViewer = ({ fileID }) => {
  const [zoom, setZoom] = useState(100);
  
  const pdfFile = useQuery(
    api.pdfFiles.getPdfFile,
    fileID ? { fileID } : "skip"
  );

  if (!fileID) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-2">No PDF selected</p>
          <p className="text-sm text-gray-500">Select a PDF from the list to view</p>
        </div>
      </div>
    );
  }

  if (!pdfFile) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading PDF...</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleDownload = () => {
    if (pdfFile.fileUrl) {
      window.open(pdfFile.fileUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-xs">
            {pdfFile.fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-8 px-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 px-2 border-x min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-8 px-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg">
          {pdfFile.fileUrl ? (
            <iframe
              src={`${pdfFile.fileUrl}#toolbar=0`}
              className="w-full h-full min-h-[800px]"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s',
              }}
              title={pdfFile.fileName}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-red-500">PDF URL not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
