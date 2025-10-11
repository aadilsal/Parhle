import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all documents with their embeddings
 */
export const getAllDocuments = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    return documents;
  },
});

/**
 * Get document count
 */
export const getDocumentCount = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    return { count: documents.length };
  },
});

/**
 * Get documents for a specific file
 */
export const getDocumentsByFile = query({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("metadata.fileID"), args.fileID))
      .collect();
    
    return documents;
  },
});
