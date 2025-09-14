import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Sync Whop user data with Convex database
 */
export const syncWhopUser = mutation({
  args: {
    whopUserId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    subscriptionData: v.object({
      tier: v.string(),
      subscriptionId: v.union(v.string(), v.null()),
      isActive: v.boolean(),
      whopProductId: v.union(v.string(), v.null()),
      planId: v.union(v.string(), v.null()),
      expiresAt: v.union(v.number(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const { whopUserId, email, name, avatarUrl, subscriptionData } = args;
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", whopUserId))
      .unique();
    
    const now = Date.now();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        name,
        avatarUrl,
        subscriptionTier: subscriptionData.tier,
        subscriptionId: subscriptionData.subscriptionId ?? undefined,
        lastActiveAt: now,
        lastSyncedAt: now,
      });
      
      return existingUser._id;
    } else {
      // Create new user with default values
      const userId = await ctx.db.insert("users", {
        whopUserId,
        email,
        name,
        avatarUrl,
        subscriptionTier: subscriptionData.tier,
        subscriptionId: subscriptionData.subscriptionId ?? undefined,
        whopCustomerId: subscriptionData.whopProductId ?? undefined,
        creditsRemaining: getInitialCredits(subscriptionData.tier),
        creditsUsedThisMonth: 0,
        lifetimeCreditsUsed: 0,
        onboardingCompleted: false,
        preferences: {
          defaultStyle: undefined,
          autoSaveEnabled: true,
          emailNotifications: true,
          webhookUrl: undefined,
        },
        metadata: {
          source: "whop",
          referralCode: undefined,
          utm: undefined,
        },
        limits: getLimitsForTier(subscriptionData.tier),
        createdAt: now,
        lastActiveAt: now,
        lastSyncedAt: now,
      });
      
      return userId;
    }
  },
});

/**
 * Update user subscription data
 */
export const updateUserSubscription = mutation({
  args: {
    whopUserId: v.string(),
    subscriptionData: v.object({
      tier: v.string(),
      subscriptionId: v.union(v.string(), v.null()),
      isActive: v.boolean(),
      whopProductId: v.union(v.string(), v.null()),
      planId: v.union(v.string(), v.null()),
      expiresAt: v.union(v.number(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const { whopUserId, subscriptionData } = args;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", whopUserId))
      .unique();
    
    if (!user) {
      throw new Error(`User not found: ${whopUserId}`);
    }
    
    // Update subscription and limits
    await ctx.db.patch(user._id, {
      subscriptionTier: subscriptionData.tier,
      subscriptionId: subscriptionData.subscriptionId ?? undefined,
      limits: getLimitsForTier(subscriptionData.tier),
      lastSyncedAt: Date.now(),
    });
    
    // If upgrading, add bonus credits
    if (subscriptionData.tier !== "starter" && user.subscriptionTier === "starter") {
      const bonusCredits = getBonusCreditsForUpgrade(subscriptionData.tier);
      await ctx.db.patch(user._id, {
        creditsRemaining: user.creditsRemaining + bonusCredits,
      });
    }
    
    return user._id;
  },
});

/**
 * Get user by Whop ID
 */
export const getUserByWhopId = query({
  args: { whopUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();
  },
});

/**
 * Update user's last active timestamp
 */
export const updateUserActivity = mutation({
  args: { whopUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();
    
    if (user) {
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
    }
  },
});

/**
 * Deduct credits from user account
 */
export const deductCredits = mutation({
  args: {
    whopUserId: v.string(),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { whopUserId, amount, reason = "mockup_generation" } = args;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", whopUserId))
      .unique();
    
    if (!user) {
      throw new Error(`User not found: ${whopUserId}`);
    }
    
    if (user.creditsRemaining < amount) {
      throw new Error("Insufficient credits");
    }
    
    // Deduct credits
    await ctx.db.patch(user._id, {
      creditsRemaining: user.creditsRemaining - amount,
      creditsUsedThisMonth: user.creditsUsedThisMonth + amount,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed + amount,
    });
    
    // Log the credit usage
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `credit_${Date.now()}`,
      event: "credit_deduction",
      category: "billing",
      action: reason,
      value: amount,
      timestamp: Date.now(),
    });
    
    return user.creditsRemaining - amount;
  },
});

/**
 * Add credits to user account
 */
export const addCredits = mutation({
  args: {
    whopUserId: v.string(),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { whopUserId, amount, reason = "credit_purchase" } = args;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", whopUserId))
      .unique();
    
    if (!user) {
      throw new Error(`User not found: ${whopUserId}`);
    }
    
    await ctx.db.patch(user._id, {
      creditsRemaining: user.creditsRemaining + amount,
    });
    
    // Log the credit addition
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `credit_add_${Date.now()}`,
      event: "credit_addition",
      category: "billing",
      action: reason,
      value: amount,
      timestamp: Date.now(),
    });
    
    return user.creditsRemaining + amount;
  },
});

/**
 * Complete user onboarding
 */
export const completeOnboarding = mutation({
  args: {
    whopUserId: v.string(),
    preferences: v.optional(v.object({
      defaultStyle: v.optional(v.string()),
      autoSaveEnabled: v.boolean(),
      emailNotifications: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { whopUserId, preferences } = args;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", whopUserId))
      .unique();
    
    if (!user) {
      throw new Error(`User not found: ${whopUserId}`);
    }
    
    const updates: any = {
      onboardingCompleted: true,
    };
    
    if (preferences) {
      updates.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }
    
    await ctx.db.patch(user._id, updates);
    
    // Give onboarding bonus credits
    const bonusCredits = 10;
    await ctx.db.patch(user._id, {
      creditsRemaining: user.creditsRemaining + bonusCredits,
    });
    
    return user._id;
  },
});

// Helper functions

/**
 * Get initial credits based on subscription tier
 */
function getInitialCredits(tier: string): number {
  const creditMap: Record<string, number> = {
    starter: 5,
    growth: 50,
    pro: 200,
  };
  return creditMap[tier] || 5;
}

/**
 * Get bonus credits for tier upgrade
 */
function getBonusCreditsForUpgrade(tier: string): number {
  const bonusMap: Record<string, number> = {
    growth: 25,
    pro: 100,
  };
  return bonusMap[tier] || 0;
}

/**
 * Get limits based on subscription tier
 */
function getLimitsForTier(tier: string) {
  const limitsMap: Record<string, any> = {
    starter: {
      maxFileSize: 10, // MB
      maxConcurrentJobs: 1,
      apiRateLimit: 10, // requests per minute
    },
    growth: {
      maxFileSize: 25,
      maxConcurrentJobs: 3,
      apiRateLimit: 30,
    },
    pro: {
      maxFileSize: 50,
      maxConcurrentJobs: 10,
      apiRateLimit: 100,
    },
  };
  return limitsMap[tier] || limitsMap.starter;
}