import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all PDF files for the current user
 */
export const getUserPdfFiles = query({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("pdfFiles")
      .filter((q) => q.eq(q.field("createdby"), args.userEmail))
      .order("desc")
      .collect();
    
    return files;
  },
});

/**
 * Get a specific PDF file by ID
 */
export const getPdfFile = query({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("pdfFiles")
      .filter((q) => q.eq(q.field("fileID"), args.fileID))
      .first();
    
    return file;
  },
});

/**
 * Delete a PDF file and all its related data (embeddings, documents, chat messages)
 */
export const deletePdfFile = mutation({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete the PDF file entry
    const file = await ctx.db
      .query("pdfFiles")
      .filter((q) => q.eq(q.field("fileID"), args.fileID))
      .first();
    
    if (file) {
      await ctx.db.delete(file._id);
    }

    // Delete all embeddings for this file
    const embeddings = await ctx.db
      .query("embeddings")
      .filter((q) => q.eq(q.field("fileID"), args.fileID))
      .collect();
    
    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }

    // Delete all documents for this file
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("metadata.fileID"), args.fileID))
      .collect();
    
    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    // Delete all chat messages for this file
    const messages = await ctx.db
      .query("chatMessages")
      .filter((q) => q.eq(q.field("fileID"), args.fileID))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { 
      success: true, 
      deleted: { 
        file: 1, 
        embeddings: embeddings.length, 
        documents: documents.length,
        messages: messages.length 
      } 
    };
  },
});

/**
 * Get document count for a specific file
 */
export const getFileDocumentCount = query({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("metadata.fileID"), args.fileID))
      .collect();
    
    return { count: documents.length };
  },
});
