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
    fileUrl:v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.insert("pdfFiles", {
      fileID: args.fileID,
      storageID: args.storageID,
      fileName: args.fileName,
      createdby: args.createdBy,
      fileUrl:args.fileUrl,
    });
    return { success: true, entry: result };
  },
});

export const getFileURL=mutation({
  args:{
    storageID:v.string(),
  },
  handler:async(ctx,args)=>{
    const url =await ctx.storage.getUrl(args.storageID);
    return url;
  }
})