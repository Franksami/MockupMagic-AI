import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Apply mockup to Whop store product
 */
export const applyMockupToStore = mutation({
  args: {
    whopUserId: v.string(),
    whopProductId: v.string(),
    mockupId: v.optional(v.id("mockups")),
    templateId: v.optional(v.id("communityTemplates")),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate user has access to apply mockups
    if (user.subscriptionTier === "starter" && user.creditsRemaining < 5) {
      throw new Error("Insufficient credits to apply mockup to store");
    }

    // Record the application in whopIntegrations table
    const integrationId = await ctx.db.insert("whopIntegrations", {
      userId: user._id,
      whopProductId: args.whopProductId,
      productName: `Product ${args.whopProductId}`, // Would get from Whop API
      productType: "digital", // Would get from Whop API
      syncEnabled: true,
      lastSyncedAt: Date.now(),
      syncFrequency: "realtime",
      syncedMockups: args.mockupId ? [args.mockupId] : [],
      autoGenerateEnabled: false,
      autoGenerateTemplates: [],
      metrics: {
        conversionBefore: undefined,
        conversionAfter: undefined,
        viewsIncrease: undefined,
        salesIncrease: undefined,
      },
      settings: {
        mockupId: args.mockupId,
        templateId: args.templateId,
        appliedAt: Date.now(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Deduct credits for application (if not Pro tier)
    if (user.subscriptionTier !== "pro") {
      const creditCost = 2; // Cost to apply mockup to store

      if (user.creditsRemaining < creditCost) {
        throw new Error("Insufficient credits");
      }

      await ctx.db.patch(user._id, {
        creditsRemaining: user.creditsRemaining - creditCost,
        creditsUsedThisMonth: user.creditsUsedThisMonth + creditCost,
        lifetimeCreditsUsed: user.lifetimeCreditsUsed + creditCost,
      });

      // Log credit usage
      await ctx.db.insert("analytics", {
        userId: user._id,
        sessionId: `store_apply_${Date.now()}`,
        event: "credit_deduction",
        category: "billing",
        action: "store_application",
        value: creditCost,
        mockupId: args.mockupId,
        metadata: {
          whopProductId: args.whopProductId,
          integrationId,
        },
        timestamp: Date.now(),
      });
    }

    // Track store application analytics
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `store_integration_${Date.now()}`,
      event: "whop_store_application",
      category: "integration",
      action: "apply_mockup",
      mockupId: args.mockupId,
      templateId: undefined, // Skip templateId for now to avoid type issues
      metadata: {
        whopProductId: args.whopProductId,
        integrationId,
        userTier: user.subscriptionTier,
        communityTemplateId: args.templateId,
      },
      timestamp: Date.now(),
    });

    return integrationId;
  },
});

/**
 * Get user's Whop store analytics (alias for compatibility)
 */
export const getUserStoreAnalytics = query({
  args: {
    whopUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      return [];
    }

    const analytics = await ctx.db
      .query("whopStoreAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 10);

    return analytics;
  },
});

/**
 * Record Whop store performance metrics
 */
export const recordStoreMetrics = mutation({
  args: {
    whopUserId: v.string(),
    whopStoreId: v.string(),
    mockupId: v.optional(v.id("mockups")),
    templateId: v.optional(v.id("communityTemplates")),
    metric: v.string(), // "conversion_rate", "page_views", "sales", "engagement"
    beforeValue: v.number(),
    afterValue: v.number(),
    measurementPeriodDays: v.number(),
    storeCategory: v.string(),
    productCount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const improvementPercent = args.beforeValue > 0
      ? ((args.afterValue - args.beforeValue) / args.beforeValue) * 100
      : 0;

    const now = Date.now();
    const measurementPeriod = {
      startDate: now - (args.measurementPeriodDays * 24 * 60 * 60 * 1000),
      endDate: now,
      durationDays: args.measurementPeriodDays,
    };

    const analyticsId = await ctx.db.insert("whopStoreAnalytics", {
      userId: user._id,
      whopStoreId: args.whopStoreId,
      mockupId: args.mockupId,
      templateId: args.templateId,
      metric: args.metric,
      beforeValue: args.beforeValue,
      afterValue: args.afterValue,
      improvementPercent,
      measurementPeriod,
      mockupAppliedAt: now,
      storeCategory: args.storeCategory,
      productCount: args.productCount,
      verified: false, // Requires verification
      verifiedBy: undefined,
      createdAt: now,
    });

    // Track as analytics event
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `store_metrics_${Date.now()}`,
      event: "store_performance_recorded",
      category: "analytics",
      action: args.metric,
      value: improvementPercent,
      mockupId: args.mockupId,
      templateId: undefined, // Skip templateId for now to avoid type issues
      metadata: {
        whopStoreId: args.whopStoreId,
        beforeValue: args.beforeValue,
        afterValue: args.afterValue,
        measurementPeriodDays: args.measurementPeriodDays,
        analyticsId,
        communityTemplateId: args.templateId,
      },
      timestamp: now,
    });

    return analyticsId;
  },
});

/**
 * Get Whop integrations for user
 */
export const getUserWhopIntegrations = query({
  args: {
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      return [];
    }

    const integrations = await ctx.db
      .query("whopIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Enrich with mockup/template data
    const enrichedIntegrations = await Promise.all(
      integrations.map(async (integration) => {
        let mockupData = null;
        let templateData = null;

        if (integration.syncedMockups.length > 0) {
          mockupData = await ctx.db.get(integration.syncedMockups[0]);
        }

        if (integration.settings?.templateId) {
          templateData = await ctx.db.get(integration.settings.templateId);
        }

        return {
          ...integration,
          mockupData,
          templateData,
        };
      })
    );

    return enrichedIntegrations;
  },
});

/**
 * Update Whop integration settings
 */
export const updateWhopIntegration = mutation({
  args: {
    integrationId: v.id("whopIntegrations"),
    settings: v.optional(v.any()),
    syncEnabled: v.optional(v.boolean()),
    autoGenerateEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.settings !== undefined) {
      updates.settings = { ...integration.settings, ...args.settings };
    }

    if (args.syncEnabled !== undefined) {
      updates.syncEnabled = args.syncEnabled;
    }

    if (args.autoGenerateEnabled !== undefined) {
      updates.autoGenerateEnabled = args.autoGenerateEnabled;
    }

    await ctx.db.patch(args.integrationId, updates);

    return args.integrationId;
  },
});

/**
 * Get community ROI data for social proof
 */
export const getCommunityROIData = query({
  args: {
    metric: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let analytics;
    
    if (args.metric) {
      analytics = await ctx.db
        .query("whopStoreAnalytics")
        .withIndex("by_metric", (q) => q.eq("metric", args.metric!))
        .filter((q) => q.eq(q.field("verified"), true))
        .order("desc")
        .take(limit);
    } else {
      analytics = await ctx.db
        .query("whopStoreAnalytics")
        .filter((q) => q.eq(q.field("verified"), true))
        .order("desc")
        .take(limit);
    }

    // Calculate community averages
    const metrics = analytics.reduce((acc, item) => {
      if (!acc[item.metric]) {
        acc[item.metric] = {
          totalImprovement: 0,
          count: 0,
          bestCase: 0,
          samples: [],
        };
      }

      acc[item.metric].totalImprovement += item.improvementPercent;
      acc[item.metric].count += 1;
      acc[item.metric].bestCase = Math.max(acc[item.metric].bestCase, item.improvementPercent);
      acc[item.metric].samples.push({
        improvement: item.improvementPercent,
        storeCategory: item.storeCategory,
        beforeValue: item.beforeValue,
        afterValue: item.afterValue,
      });

      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(metrics).forEach(metricKey => {
      const metric = metrics[metricKey];
      metric.average = metric.count > 0 ? metric.totalImprovement / metric.count : 0;
    });

    return {
      metrics,
      totalSamples: analytics.length,
      communityStats: {
        avgConversionBoost: metrics.conversion_rate?.average || 0,
        avgSalesIncrease: metrics.sales?.average || 0,
        avgViewsIncrease: metrics.page_views?.average || 0,
        topPerformers: analytics
          .sort((a, b) => b.improvementPercent - a.improvementPercent)
          .slice(0, 5),
      },
    };
  },
});