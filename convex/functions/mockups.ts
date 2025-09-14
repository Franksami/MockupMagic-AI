import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get user's active jobs
export const getUserActiveJobs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "queued") || q.eq(q.field("status"), "processing"))
      .collect();
    
    return jobs;
  },
});

// Create a new mockup
export const create = mutation({
  args: {
    userId: v.id("users"),
    mockupType: v.string(),
    prompt: v.string(),
    settings: v.any(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const mockupId = await ctx.db.insert("mockups", {
      userId: args.userId,
      projectId: args.projectId,
      mockupType: args.mockupType,
      prompt: args.prompt,
      modelVersion: "sdxl-1.0", // Default model version
      settings: args.settings,
      status: "pending",
      generationTimeMs: 0,
      processingSteps: 0,
      retryCount: 0,
      downloads: 0,
      shares: 0,
      tags: [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
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
    priority: v.number(),
    estimatedCredits: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const jobId = await ctx.db.insert("generationJobs", {
      userId: args.userId,
      mockupId: args.mockupId,
      type: args.type,
      status: "queued",
      priority: args.priority,
      attempts: 0,
      maxAttempts: 3,
      queuedAt: now,
      estimatedCredits: args.estimatedCredits,
    });

    return jobId;
  },
});

// Update job status
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("generationJobs"),
    status: v.string(),
    error: v.optional(v.string()),
    actualCredits: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "processing") {
      updates.startedAt = Date.now();
    } else if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.actualCredits !== undefined) {
      updates.actualCredits = args.actualCredits;
    }

    await ctx.db.patch(args.jobId, updates);
  },
});

// Get queue stats
export const getQueueStats = query({
  args: {},
  handler: async (ctx) => {
    const queuedJobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_status_priority", (q) => q.eq("status", "queued"))
      .collect();

    const processingJobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_status_priority", (q) => q.eq("status", "processing"))
      .collect();

    return {
      queued: queuedJobs.length,
      processing: processingJobs.length,
      total: queuedJobs.length + processingJobs.length,
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

// Get job status
export const getJobStatus = query({
  args: { jobId: v.id("generationJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    return job?.status || "not_found";
  },
});

// Get mockup status
export const getMockupStatus = query({
  args: { mockupId: v.id("mockups") },
  handler: async (ctx, args) => {
    const mockup = await ctx.db.get(args.mockupId);
    return mockup?.status || "not_found";
  },
});
