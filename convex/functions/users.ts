import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get user by Whop ID
export const getByWhopId = query({
  args: { whopUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .first();
    
    return user;
  },
});

// Create a new user
export const create = mutation({
  args: {
    whopUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      whopUserId: args.whopUserId,
      email: args.email,
      name: args.name || "",
      subscriptionTier: "starter",
      creditsRemaining: 100, // Default credits for new users
      creditsUsedThisMonth: 0,
      lifetimeCreditsUsed: 0,
      onboardingCompleted: false,
      preferences: {
        defaultStyle: "modern",
        autoSaveEnabled: true,
        emailNotifications: true,
      },
      metadata: {
        source: "whop_oauth",
      },
      limits: {
        maxFileSize: 10, // MB
        maxConcurrentJobs: 1,
        apiRateLimit: 60, // requests per minute
      },
      createdAt: now,
      lastActiveAt: now,
      lastSyncedAt: now,
    });

    return userId;
  },
});

// Update user credits
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newCredits = Math.max(0, user.creditsRemaining - args.credits);
    
    await ctx.db.patch(args.userId, {
      creditsRemaining: newCredits,
      creditsUsedThisMonth: user.creditsUsedThisMonth + args.credits,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed + args.credits,
      lastActiveAt: Date.now(),
    });

    return newCredits;
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

// Update user last active time
export const updateLastActive = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });
  },
});
