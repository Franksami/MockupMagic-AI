import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create or update user profile
export const createUser = mutation({
  args: {
    whopUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    subscriptionTier: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        subscriptionTier: args.subscriptionTier,
        lastActiveAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      whopUserId: args.whopUserId,
      email: args.email,
      name: args.name,
      subscriptionTier: args.subscriptionTier,
      creditsRemaining: getInitialCredits(args.subscriptionTier),
      creditsUsedThisMonth: 0,
      lifetimeCreditsUsed: 0,
      onboardingCompleted: false,
      preferences: {
        autoSaveEnabled: true,
        emailNotifications: true,
      },
      metadata: {
        source: "organic",
      },
      limits: {
        maxFileSize: args.subscriptionTier === "pro" ? 50 : 10, // MB
        maxConcurrentJobs: args.subscriptionTier === "pro" ? 10 : 3,
        apiRateLimit: args.subscriptionTier === "pro" ? 100 : 30,
      },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      lastSyncedAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Whop ID
export const getByWhopId = query({
  args: { whopUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();
  },
});

// Update user activity
export const updateUserActivity = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });
  },
});

// Deduct credits from user account
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error(`User not found: ${args.userId}`);
    }

    if (user.creditsRemaining < args.amount) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(user._id, {
      creditsRemaining: user.creditsRemaining - args.amount,
      creditsUsedThisMonth: user.creditsUsedThisMonth + args.amount,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed + args.amount,
      lastActiveAt: Date.now(),
    });

    return user.creditsRemaining - args.amount;
  },
});

// Refund credits to user account
export const refundCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(`User not found: ${args.userId}`);
    }

    await ctx.db.patch(args.userId, {
      creditsRemaining: user.creditsRemaining + args.amount,
      creditsUsedThisMonth: Math.max(0, user.creditsUsedThisMonth - args.amount),
      lastActiveAt: Date.now(),
    });
  },
});

// Increment user stats
export const incrementStats = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error(`User not found: ${args.userId}`);
    }

    // Update activity timestamp
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });

    // Log analytics event
    await ctx.db.insert("analytics", {
      userId: args.userId,
      sessionId: `session_${Date.now()}`,
      event: args.type,
      category: "user_stats",
      action: "increment",
      value: args.amount,
      timestamp: Date.now(),
    });
  },
});

function getInitialCredits(tier: string): number {
  switch (tier) {
    case "starter": return 100;
    case "growth": return 500;
    case "pro": return 2000;
    default: return 10;
  }
}