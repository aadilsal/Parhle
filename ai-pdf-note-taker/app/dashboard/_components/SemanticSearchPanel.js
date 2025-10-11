"use client";
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader2Icon, SearchIcon } from "lucide-react";

/**
 * Semantic Search Component - Example Implementation
 * 
 * This component allows users to search their uploaded PDFs using natural language.
 * It uses the Convex action that generates embeddings and performs vector similarity search.
 * 
 * Usage:
 * 1. Import this component in your dashboard
 * 2. Add to your layout: <SemanticSearchPanel />
 * 3. Users can type natural language queries
 * 4. Results show relevant PDF chunks with metadata
 */
const SemanticSearchPanel = ({ fileID, fileName }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useMutation(api.myActions.semanticSearch);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await search({
        query: query.trim(),
        limit: 5,
        fileID: fileID || undefined,
      });

      if (response.success) {
        setResults(response.results);
      } else {
        setError(response.error || "Search failed");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred during search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Semantic Search</h2>
        <p className="text-sm text-gray-600">
          {fileID 
            ? `Searching in: ${fileName}` 
            : "Search across all your uploaded documents"}
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Ask a question or search for content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Found {results.length} relevant result{results.length !== 1 ? "s" : ""}
          </h3>

          {results.map((result, index) => (
            <div
              key={result._id}
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Metadata */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">
                    📄 {result.metadata?.fileName || "Unknown File"}
                  </span>
                  {result.metadata?.chunkIndex !== undefined && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Chunk {result.metadata.chunkIndex}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  Result #{index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="text-sm text-gray-800 leading-relaxed">
                {result.text}
              </div>

              {/* Additional Metadata */}
              {result.metadata?.chunkSize && (
                <div className="mt-2 text-xs text-gray-500">
                  {result.metadata.chunkSize} characters
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && !error && (
        <div className="text-center py-12 text-gray-500">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No results found</p>
          <p className="text-sm">Try different search terms</p>
        </div>
      )}
    </div>
  );
};

export default SemanticSearchPanel;

/**
 * HOW TO ADD THIS TO YOUR DASHBOARD:
 * 
 * 1. Import in your dashboard page:
 *    import SemanticSearchPanel from './_components/SemanticSearchPanel';
 * 
 * 2. Add to your layout:
 *    <div className="dashboard">
 *      <Header />
 *      <SemanticSearchPanel />
 *      <UploadPdfDialog>
 *        <Button>Upload PDF</Button>
 *      </UploadPdfDialog>
 *    </div>
 * 
 * 3. Make sure you have uploaded and processed at least one PDF first!
 * 
 * FEATURES:
 * - Natural language search
 * - Shows top 5 most relevant chunks
 * - Displays source file and chunk metadata
 * - Error handling and loading states
 * - Responsive design
 * 
 * CUSTOMIZATION:
 * - Change `limit: 5` to show more/fewer results
 * - Modify styling with Tailwind classes
 * - Add highlighting for matched terms
 * - Add pagination for more results
 * - Add filters by file or date
 */
