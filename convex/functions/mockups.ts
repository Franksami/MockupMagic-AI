import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { ConvexError } from "convex/values";

// Create a new mockup generation request
export const create = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    whopProductId: v.optional(v.string()),
    sourceImageId: v.optional(v.id("_storage")),
    generatedImageId: v.optional(v.id("_storage")),
    thumbnailId: v.optional(v.id("_storage")),
    mockupType: v.string(),
    templateId: v.optional(v.id("templates")),
    prompt: v.string(),
    enhancedPrompt: v.optional(v.string()),
    modelVersion: v.string(),
    settings: v.object({
      background: v.optional(v.string()),
      lighting: v.optional(v.string()),
      angle: v.optional(v.number()),
      style: v.optional(v.string()),
      quality: v.string(),
      resolution: v.object({
        width: v.number(),
        height: v.number(),
      }),
      colorCorrection: v.optional(v.boolean()),
      removeBackground: v.optional(v.boolean()),
    }),
    generationTimeMs: v.number(),
    queueTimeMs: v.optional(v.number()),
    processingSteps: v.number(),
    status: v.string(),
    retryCount: v.number(),
    downloads: v.number(),
    shares: v.number(),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const mockupId = await ctx.db.insert("mockups", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return mockupId;
  },
});

// Create a generation job
export const createGenerationJob = mutation({
  args: {
    userId: v.id("users"),
    mockupId: v.id("mockups"),
    type: v.string(),
    status: v.string(),
    priority: v.number(),
    attempts: v.number(),
    maxAttempts: v.number(),
    queuedAt: v.number(),
    estimatedCredits: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("generationJobs", args);
    return jobId;
  },
});

// Get mockups for a user
export const getUserMockups = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mockups = await ctx.db
      .query("mockups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    return mockups;
  },
});

// Get user's active generation jobs
export const getUserActiveJobs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();

    return jobs;
  },
});

// Update job status
export const updateJobStatus = mutation({
  args: {
    jobId: v.string(),
    status: v.optional(v.string()),
    replicateId: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()),
    actualCredits: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updateData } = args;
    
    const job = await ctx.db
      .query("generationJobs")
      .filter((q) => q.eq(q.field("_id"), jobId))
      .first();
    
    if (!job) {
      throw new ConvexError("Job not found");
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(job._id, {
      ...filteredUpdateData,
    });
  },
});

// Get job by Replicate ID
export const getJobByReplicateId = query({
  args: { replicateId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .withIndex("by_replicate", (q) => q.eq("replicateId", args.replicateId))
      .first();

    return job;
  },
});

// Get job details
export const getJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .filter((q) => q.eq(q.field("_id"), args.jobId))
      .first();

    return job;
  },
});

// Get next job in queue for user
export const getNextUserJob = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const nextJob = await ctx.db
      .query("generationJobs")
      .withIndex("by_status_priority", (q) => q.eq("status", "queued"))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc") // Higher priority first
      .first();

    return nextJob;
  },
});

// Update mockup status
export const updateStatus = mutation({
  args: {
    mockupId: v.id("mockups"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mockupId, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// Complete mockup generation
export const completeGeneration = mutation({
  args: {
    mockupId: v.id("mockups"),
    generatedImageId: v.optional(v.id("_storage")),
    thumbnailId: v.optional(v.id("_storage")),
    generationTimeMs: v.number(),
    processingSteps: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mockupId, {
      generatedImageId: args.generatedImageId,
      thumbnailId: args.thumbnailId,
      generationTimeMs: args.generationTimeMs,
      processingSteps: args.processingSteps,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Store generated image (using action for storage operations)
export const storeGeneratedImage = action({
  args: {
    mockupId: v.id("mockups"),
    imageBlob: v.bytes(),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Convert ArrayBuffer to Blob for storage
    const blob = new Blob([args.imageBlob], { type: args.mimeType });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

// Generate thumbnail (placeholder)
export const generateThumbnail = mutation({
  args: {
    mockupId: v.id("mockups"),
    sourceImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Generate thumbnail from source image
    // For now, return the same image ID
    return args.sourceImageId;
  },
});

// Retry failed job
export const retryJob = mutation({
  args: {
    jobId: v.string(),
    error: v.string(),
    nextRetryAt: v.number(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .filter((q) => q.eq(q.field("_id"), args.jobId))
      .first();
    
    if (!job) {
      throw new ConvexError("Job not found");
    }

    await ctx.db.patch(job._id, {
      attempts: job.attempts + 1,
      error: args.error,
      nextRetryAt: args.nextRetryAt,
      status: "queued", // Re-queue for retry
    });
  },
});

// Get job status
export const getJobStatus = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .filter((q) => q.eq(q.field("_id"), args.jobId))
      .first();

    if (!job) {
      return null;
    }

    // Also get the associated mockup
    const mockup = await ctx.db.get(job.mockupId);

    return {
      job,
      mockup,
    };
  },
});

// Get mockup status
export const getMockupStatus = query({
  args: { mockupId: v.id("mockups") },
  handler: async (ctx, args) => {
    const mockup = await ctx.db.get(args.mockupId);
    if (!mockup) {
      return null;
    }

    // Get associated job
    const job = await ctx.db
      .query("generationJobs")
      .filter((q) => q.eq(q.field("mockupId"), args.mockupId))
      .order("desc")
      .first();

    return {
      mockup,
      job,
    };
  },
});

// Get queue statistics
export const getQueueStats = query({
  args: {},
  handler: async (ctx, args) => {
    const jobs = await ctx.db.query("generationJobs").collect();
    
    const totalJobs = jobs.length;
    const queuedJobs = jobs.filter(j => j.status === 'queued').length;
    const processingJobs = jobs.filter(j => j.status === 'processing').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const failedJobs = jobs.filter(j => j.status === 'failed').length;
    
    // Calculate average processing time
    const completedJobsWithTimes = jobs.filter(j => 
      j.status === 'completed' && j.startedAt && j.completedAt
    );
    
    const avgProcessingTime = completedJobsWithTimes.length > 0
      ? completedJobsWithTimes.reduce((sum, job) => 
          sum + (job.completedAt! - job.startedAt!), 0
        ) / completedJobsWithTimes.length
      : 30000; // Default 30 seconds
    
    // Estimate wait time for new job
    const estimatedWaitTime = queuedJobs > 0 
      ? Math.ceil(queuedJobs / Math.max(1, 10 - processingJobs)) * avgProcessingTime
      : 0;

    return {
      totalJobs,
      queuedJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      averageProcessingTime: avgProcessingTime,
      estimatedWaitTime,
    };
  },
});

// Delete mockup
export const deleteMockup = mutation({
  args: { id: v.id("mockups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get mockup by ID
export const getMockup = query({
  args: { mockupId: v.id("mockups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mockupId);
  },
});

function calculateCredits(quality: string): number {
  switch (quality) {
    case "draft": return 1;
    case "standard": return 2;
    case "premium": return 4;
    default: return 2;
  }
}