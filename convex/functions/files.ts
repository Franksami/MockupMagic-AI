// convex/functions/files.ts - File Storage and Management Functions
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Generate an upload URL for storing files in Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async ({ storage }) => {
    return await storage.generateUploadUrl();
  },
});

/**
 * Save file reference in database after successful upload
 */
export const saveFileReference = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Store file metadata in database
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      userId: args.userId,
      uploadedAt: Date.now(),
      isPublic: false,
      tags: []
    });

    return fileId;
  },
});

/**
 * Get file information by storage ID
 */
export const getFileInfo = query({
  args: {
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    // Find file record by storage ID
    const file = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("storageId"), args.storageId))
      .first();

    if (!file) {
      return null;
    }

    return {
      _id: file._id,
      storageId: file.storageId,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      isPublic: file.isPublic,
      tags: file.tags
    };
  },
});

/**
 * Get file blob from storage for serving - Use getUrl for external access
 */
export const getFileForDownload = query({
  args: {
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    // Get file URL for external access
    const fileUrl = await ctx.storage.getUrl(args.storageId);

    if (!fileUrl) {
      return null;
    }

    // Also get file metadata for proper headers
    const fileInfo = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("storageId"), args.storageId))
      .first();

    return {
      url: fileUrl,
      metadata: fileInfo ? {
        filename: fileInfo.filename,
        contentType: fileInfo.contentType,
        size: fileInfo.size
      } : null
    };
  },
});

/**
 * Get public URL for a file (for serving via HTTP)
 */
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from storage and database
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id("files")
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete from database
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

/**
 * List user's files with pagination
 */
export const getUserFiles = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 50);

    return files.map(file => ({
      _id: file._id,
      storageId: file.storageId,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      isPublic: file.isPublic,
      tags: file.tags
    }));
  },
});

/**
 * Update file metadata (name, tags, visibility)
 */
export const updateFileMetadata = mutation({
  args: {
    fileId: v.id("files"),
    updates: v.object({
      filename: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    await ctx.db.patch(args.fileId, {
      ...args.updates,
      updatedAt: Date.now()
    });

    return { success: true };
  },
});

/**
 * Get storage usage stats for a user
 */
export const getUserStorageStats = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;

    // Group by content type
    const fileTypes: Record<string, number> = {};
    files.forEach(file => {
      fileTypes[file.contentType] = (fileTypes[file.contentType] || 0) + 1;
    });

    return {
      totalSize,
      fileCount,
      fileTypes,
      averageFileSize: fileCount > 0 ? totalSize / fileCount : 0
    };
  },
});