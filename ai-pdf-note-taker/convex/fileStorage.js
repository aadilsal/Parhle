import { v } from "convex/values";
import { mutation } from "./_generated/server";


export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const addFileEntryToDb = mutation({
  args: {
    fileID: v.string(),
    storageID: v.string(),
    fileName: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.insert("pdfFiles", {
      fileID: args.fileID,
      storageID: args.storageID,
      fileName: args.fileName,
      createdBy: args.createdBy,
    });
    return { success: true, entry: result };
  },
});
