import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Store document embeddings in the documents table
 */
export const addDocuments = mutation({
  args: {
    documents: v.array(
      v.object({
        text: v.string(),
        embedding: v.array(v.number()),
        metadata: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const doc of args.documents) {
      const id = await ctx.db.insert("documents", {
        text: doc.text,
        embedding: doc.embedding,
        metadata: doc.metadata,
      });
      insertedIds.push(id);
    }
    return { success: true, count: insertedIds.length, ids: insertedIds };
  },
});

/**
 * Search for similar documents using vector similarity
 * Calculates cosine similarity manually since Convex vector search API varies by version
 */
export const searchSimilar = query({
  args: {
    embedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    // Get all documents (we'll filter by similarity)
    const allDocs = await ctx.db.query("documents").collect();
    
    // Calculate cosine similarity for each document
    const docsWithScores = allDocs.map(doc => {
      const score = cosineSimilarity(args.embedding, doc.embedding);
      return { ...doc, _score: score };
    });
    
    // Sort by similarity score (highest first) and take top results
    const results = docsWithScores
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    return results;
  },
});

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Get all documents for a specific file
 */
export const getDocumentsByMetadata = query({
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

/**
 * Delete all documents for a specific file
 */
export const deleteDocumentsByFileID = mutation({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("metadata.fileID"), args.fileID))
      .collect();
    
    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }
    
    return { success: true, deleted: documents.length };
  },
});
