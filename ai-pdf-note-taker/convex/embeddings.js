import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const addEmbeddingsBatch = mutation({
  args: {
    fileID: v.string(),
    createdBy: v.string(),
    embeddings: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        embedding: v.array(v.number()),
        metadata: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const inserted = [];
    for (const e of args.embeddings) {
      const row = await ctx.db.insert("embeddings", {
        fileID: args.fileID,
        chunkIndex: e.chunkIndex,
        text: e.text,
        embedding: e.embedding,
        metadata: e.metadata,
        createdBy: args.createdBy,
      });
      inserted.push(row);
    }
    return { success: true, inserted };
  },
});
