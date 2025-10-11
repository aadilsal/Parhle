import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Save a chat message to the database
 */
export const saveMessage = mutation({
  args: {
    fileID: v.string(),
    userEmail: v.string(),
    role: v.string(),
    content: v.string(),
    contextUsed: v.optional(v.number()),
    sources: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      fileID: args.fileID,
      userEmail: args.userEmail,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      contextUsed: args.contextUsed,
      sources: args.sources,
    });
    return messageId;
  },
});

/**
 * Get all messages for a specific file and user (conversation history)
 */
export const getFileMessages = query({
  args: {
    fileID: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_file_and_user", (q) =>
        q.eq("fileID", args.fileID).eq("userEmail", args.userEmail)
      )
      .collect();

    // Sort by timestamp (oldest first)
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  },
});

/**
 * Get all messages for a user across all PDFs
 */
export const getUserMessages = query({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userEmail", args.userEmail))
      .collect();

    return messages.sort((a, b) => a.timestamp - b.timestamp);
  },
});

/**
 * Clear all messages for a specific file and user
 */
export const clearFileMessages = mutation({
  args: {
    fileID: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_file_and_user", (q) =>
        q.eq("fileID", args.fileID).eq("userEmail", args.userEmail)
      )
      .collect();

    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deleted: messages.length };
  },
});

/**
 * Delete all messages associated with a PDF file (called when file is deleted)
 */
export const deleteFileMessages = mutation({
  args: {
    fileID: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_file", (q) => q.eq("fileID", args.fileID))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deleted: messages.length };
  },
});

/**
 * Get conversation statistics for a user (for study analytics)
 */
export const getConversationStats = query({
  args: {
    userEmail: v.string(),
    fileID: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let messages;
    
    if (args.fileID) {
      messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_file_and_user", (q) =>
          q.eq("fileID", args.fileID).eq("userEmail", args.userEmail)
        )
        .collect();
    } else {
      messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_user", (q) => q.eq("userEmail", args.userEmail))
        .collect();
    }

    const userMessages = messages.filter(m => m.role === "user");
    const assistantMessages = messages.filter(m => m.role === "assistant");

    return {
      totalMessages: messages.length,
      userQuestions: userMessages.length,
      aiResponses: assistantMessages.length,
      firstInteraction: messages.length > 0 ? messages[0].timestamp : null,
      lastInteraction: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    };
  },
});
