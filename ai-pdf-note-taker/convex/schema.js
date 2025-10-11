import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        userName: v.string(),
        email: v.string(),
        imageUrl: v.string()
    }),

    pdfFiles:defineTable({
        fileID:v.string(),
        storageID:v.string(),
        fileName:v.string(),
        fileUrl:v.string(),
        createdby:v.string(), 
    }),
    
    embeddings: defineTable({
        fileID: v.string(),
        chunkIndex: v.number(),
        text: v.string(),
        embedding: v.array(v.number()),
        metadata: v.any(),
        createdBy: v.string()
    }),
    
    documents: defineTable({
        embedding: v.array(v.number()),
        text: v.string(),
        metadata: v.any(),
    }).vectorIndex("byEmbedding", {
        vectorField: "embedding",
        dimensions: 768,
    }),
    
    // Chat messages for conversation history - students can review previous sessions
    chatMessages: defineTable({
        fileID: v.string(),           // Which PDF this message belongs to
        userEmail: v.string(),         // Which user sent/received this message
        role: v.string(),              // "user" or "assistant"
        content: v.string(),           // The message text
        timestamp: v.number(),         // When message was sent
        contextUsed: v.optional(v.number()),  // How many chunks were used (for assistant messages)
        sources: v.optional(v.array(v.any())), // Source information for transparency
    })
    .index("by_file_and_user", ["fileID", "userEmail"])
    .index("by_user", ["userEmail"])
    .index("by_file", ["fileID"])
});