import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create some sample community templates for testing
 */
export const createSampleTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // First, get or create a sample user
    let sampleUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("whopUserId"), "dev_user_123"))
      .first();

    if (!sampleUser) {
      // Create a sample user for testing
      const userId = await ctx.db.insert("users", {
        whopUserId: "dev_user_123",
        email: "dev@mockupmagic.com",
        name: "Dev User",
        subscriptionTier: "pro",
        creditsRemaining: 1000,
        creditsUsedThisMonth: 0,
        lifetimeCreditsUsed: 0,
        onboardingCompleted: true,
        preferences: {
          autoSaveEnabled: true,
          emailNotifications: true
        },
        metadata: {
          source: "development"
        },
        limits: {
          maxFileSize: 50,
          maxConcurrentJobs: 10,
          apiRateLimit: 100
        },
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        lastSyncedAt: Date.now()
      });
      sampleUser = await ctx.db.get(userId);
    }

    if (!sampleUser) {
      throw new Error("Failed to create or retrieve sample user");
    }

    // Create some basic templates first
    const template1Id = await ctx.db.insert("templates", {
      name: "Premium Digital Product Mockup",
      slug: "premium-digital-product-mockup",
      description: "High-converting mockup for digital products",
      category: "digital-products",
      thumbnailId: undefined,
      previewIds: [],
      config: {
        mockupType: "digital-product",
        basePrompt: "professional digital product mockup",
        defaultSettings: {},
        supportedFormats: ["png", "jpg"]
      },
      isPublic: true,
      isPremium: true,
      requiredTier: "growth",
      createdBy: sampleUser._id,
      isOfficial: false,
      usageCount: 0,
      avgRating: 4.8,
      totalRatings: 23,
      tags: ["digital", "premium", "conversion"],
      searchKeywords: ["digital", "product", "mockup"],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const template2Id = await ctx.db.insert("templates", {
      name: "Free Course Landing Page",
      slug: "free-course-landing-page",
      description: "Clean course landing page mockup",
      category: "courses",
      thumbnailId: undefined,
      previewIds: [],
      config: {
        mockupType: "course-landing",
        basePrompt: "course landing page mockup",
        defaultSettings: {},
        supportedFormats: ["png", "jpg"]
      },
      isPublic: true,
      isPremium: false,
      requiredTier: "starter",
      createdBy: sampleUser._id,
      isOfficial: false,
      usageCount: 0,
      avgRating: 4.6,
      totalRatings: 45,
      tags: ["course", "free", "education"],
      searchKeywords: ["course", "landing", "page"],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Create sample community templates for testing
    const sampleTemplates = [
      {
        templateId: template1Id,
        creatorId: sampleUser._id,
        title: "Premium Digital Product Mockup",
        description: "High-converting mockup for digital products with modern design",
        shareType: "premium",
        price: 29.99,
        storeCategories: ["digital-products", "templates"],
        tags: ["digital", "premium", "conversion"],
        likes: 45,
        downloads: 120,
        rating: 4.8,
        reviewCount: 23,
        status: "approved",
        featured: true,
        conversionData: {
          improvementPercent: 35,
          storeType: "digital-products",
          sampleSize: 50
        }
      },
      {
        templateId: template2Id,
        creatorId: sampleUser._id,
        title: "Free Course Landing Page",
        description: "Clean and professional mockup for course landing pages",
        shareType: "free",
        storeCategories: ["courses", "education"],
        tags: ["course", "free", "education"],
        likes: 89,
        downloads: 234,
        rating: 4.6,
        reviewCount: 45,
        status: "approved",
        featured: false,
        conversionData: {
          improvementPercent: 28,
          storeType: "courses",
          sampleSize: 75
        }
      }
    ];

    const createdTemplates = [];
    for (const template of sampleTemplates) {
      const id = await ctx.db.insert("communityTemplates", {
        ...template,
        shares: 0,
        creatorEarnings: 0,
        platformCommission: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      createdTemplates.push(id);
    }

    return createdTemplates;
  }
});

/**
 * Get community templates with filtering and sorting
 */
export const getCommunityTemplates = query({
  args: {
    filterType: v.optional(v.string()), // "all", "free", "premium", "featured", "trending"
    sortBy: v.optional(v.string()), // "popular", "recent", "rating", "downloads"
    searchQuery: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      filterType = "all",
      sortBy = "popular",
      searchQuery = "",
      category,
      limit = 20
    } = args;

    // Apply status filter and build query
    let templates;
    try {
      if (filterType === "featured") {
        templates = await ctx.db
          .query("communityTemplates")
          .withIndex("by_featured", (q) => q.eq("featured", true))
          .collect();
      } else if (filterType === "free") {
        templates = await ctx.db
          .query("communityTemplates")
          .filter((q) => q.eq(q.field("shareType"), "free"))
          .collect();
      } else if (filterType === "premium") {
        templates = await ctx.db
          .query("communityTemplates")
          .filter((q) => q.eq(q.field("shareType"), "premium"))
          .collect();
      } else {
        // Default to approved templates
        templates = await ctx.db
          .query("communityTemplates")
          .withIndex("by_status", (q) => q.eq("status", "approved"))
          .collect();
      }
    } catch (error) {
      console.error("Error querying community templates:", error);
      // Fallback to simple query if index doesn't exist
      templates = await ctx.db
        .query("communityTemplates")
        .collect();
    }

    // Filter by search query
    if (searchQuery) {
      templates = templates.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (category) {
      templates = templates.filter(template =>
        template.storeCategories.includes(category)
      );
    }

    // Sort templates
    templates.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.createdAt - a.createdAt;
        case "rating":
          return b.rating - a.rating;
        case "downloads":
          return b.downloads - a.downloads;
        case "popular":
        default:
          // Popularity score: downloads * 0.4 + rating * 0.3 + likes * 0.3
          const scoreA = (a.downloads * 0.4) + (a.rating * 0.3) + (a.likes * 0.3);
          const scoreB = (b.downloads * 0.4) + (b.rating * 0.3) + (b.likes * 0.3);
          return scoreB - scoreA;
      }
    });

    // Limit results
    templates = templates.slice(0, limit);

    // Enrich with creator data
    const enrichedTemplates = await Promise.all(
      templates.map(async (template) => {
        const creator = await ctx.db.get(template.creatorId) as any;
        const originalTemplate = await ctx.db.get(template.templateId) as any;

        return {
          ...template,
          creator: creator ? {
            name: creator.name,
            avatarUrl: creator.avatarUrl,
            whopUserId: creator.whopUserId,
            subscriptionTier: creator.subscriptionTier,
          } : null,
          originalTemplate: originalTemplate ? {
            name: originalTemplate.name,
            category: originalTemplate.category,
            thumbnailId: originalTemplate.thumbnailId,
          } : null,
        };
      })
    );

    return enrichedTemplates;
  },
});

/**
 * Get featured creators
 */
export const getFeaturedCreators = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    // Get top creators by earnings and template performance
    let creatorProfiles;
    try {
      creatorProfiles = await ctx.db
        .query("creatorProfiles")
        .withIndex("by_earnings")
        .order("desc")
        .take(limit * 2); // Get more to filter for active creators
    } catch (error) {
      console.error("Error querying creator profiles:", error);
      // Fallback to simple query if index doesn't exist
      creatorProfiles = await ctx.db
        .query("creatorProfiles")
        .take(limit * 2);
    }

    // Filter for active creators with recent activity
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeCreators = await Promise.all(
      creatorProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId) as any;

        if (!user || user.lastActiveAt < thirtyDaysAgo) {
          return null;
        }

        return {
          ...profile,
          name: user.name,
          avatarUrl: user.avatarUrl,
          whopUserId: user.whopUserId,
        };
      })
    );

    return activeCreators
      .filter(Boolean)
      .slice(0, limit);
  },
});

/**
 * Submit a template to the community marketplace
 */
export const submitCommunityTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    whopUserId: v.string(),
    title: v.string(),
    description: v.string(),
    shareType: v.string(), // "free", "premium", "exclusive"
    price: v.optional(v.number()),
    storeCategories: v.array(v.string()),
    tags: v.array(v.string()),
    whopCommunityId: v.optional(v.string()),
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

    // Validate template exists and belongs to user
    const template = await ctx.db.get(args.templateId) as any;
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if template is already shared
    const existingShare = await ctx.db
      .query("communityTemplates")
      .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
      .unique();

    if (existingShare) {
      throw new Error("Template is already shared in the community");
    }

    // Create community template entry
    const communityTemplateId = await ctx.db.insert("communityTemplates", {
      templateId: args.templateId,
      creatorId: user._id,
      whopCommunityId: args.whopCommunityId,
      title: args.title,
      description: args.description,
      shareType: args.shareType,
      likes: 0,
      downloads: 0,
      shares: 0,
      rating: 0,
      reviewCount: 0,
      price: args.price,
      currency: args.price ? "usd" : undefined,
      creatorEarnings: 0,
      platformCommission: 0,
      status: "pending", // Requires moderation
      conversionData: {
        beforeConversion: undefined,
        afterConversion: undefined,
        improvementPercent: undefined,
        storeType: undefined,
        sampleSize: undefined,
      },
      tags: args.tags,
      storeCategories: args.storeCategories,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update creator profile stats
    await updateCreatorStats(ctx, user._id);

    // Track analytics event
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `template_submit_${Date.now()}`,
      event: "template_submission",
      category: "community",
      action: "submit",
      label: args.shareType,
      templateId: args.templateId,
      metadata: {
        communityTemplateId,
        shareType: args.shareType,
        price: args.price,
        storeCategories: args.storeCategories,
      },
      timestamp: Date.now(),
    });

    return communityTemplateId;
  },
});

/**
 * Like/unlike a community template
 */
export const toggleTemplateLike = mutation({
  args: {
    templateId: v.id("communityTemplates"),
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const template = await ctx.db.get(args.templateId) as any;
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if user already liked (would need a likes table for full implementation)
    // For now, just increment likes
    await ctx.db.patch(args.templateId, {
      likes: template.likes + 1,
      updatedAt: Date.now(),
    });

    // Track engagement
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `template_like_${Date.now()}`,
      event: "template_engagement",
      category: "community",
      action: "like",
      templateId: template.templateId,
      metadata: {
        communityTemplateId: args.templateId,
      },
      timestamp: Date.now(),
    });

    return template.likes + 1;
  },
});

/**
 * Download a community template
 */
export const downloadCommunityTemplate = mutation({
  args: {
    templateId: v.id("communityTemplates"),
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const template = await ctx.db.get(args.templateId) as any;
    if (!template) {
      throw new Error("Template not found");
    }

    // Check user permissions
    if (template.shareType === "premium" && user.subscriptionTier === "starter") {
      throw new Error("Premium template requires Growth or Pro subscription");
    }

    // Increment download count
    await ctx.db.patch(args.templateId, {
      downloads: template.downloads + 1,
      updatedAt: Date.now(),
    });

    // Update creator earnings if paid template
    if (template.price && template.price > 0) {
      const creatorShare = template.price * 0.9; // 90% to creator
      const platformShare = template.price * 0.1; // 10% platform fee

      await ctx.db.patch(args.templateId, {
        creatorEarnings: template.creatorEarnings + creatorShare,
        platformCommission: template.platformCommission + platformShare,
      });

      // Log billing event for creator
      await ctx.db.insert("billingEvents", {
        userId: template.creatorId,
        type: "template_sale",
        amount: creatorShare,
        currency: "usd",
        status: "completed",
        description: `Template sale: ${template.title}`,
        metadata: {
          templateId: args.templateId,
          buyerId: user._id,
          originalPrice: template.price,
          platformCommission: platformShare,
        },
        createdAt: Date.now(),
      });
    }

    // Track analytics
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `template_download_${Date.now()}`,
      event: "template_download",
      category: "community",
      action: "download",
      value: template.price || 0,
      templateId: template.templateId,
      metadata: {
        communityTemplateId: args.templateId,
        shareType: template.shareType,
        price: template.price,
      },
      timestamp: Date.now(),
    });

    return template.templateId;
  },
});

/**
 * Update creator profile statistics
 */
async function updateCreatorStats(ctx: any, userId: string) {
  // Get or create creator profile
  let creatorProfile = await ctx.db
    .query("creatorProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  // Calculate stats from community templates
  const userTemplates = await ctx.db
    .query("communityTemplates")
    .withIndex("by_creator", (q: any) => q.eq("creatorId", userId))
    .collect();

  const totalDownloads = userTemplates.reduce((sum: number, t: any) => sum + t.downloads, 0);
  const totalEarnings = userTemplates.reduce((sum: number, t: any) => sum + t.creatorEarnings, 0);
  const avgRating = userTemplates.length > 0
    ? userTemplates.reduce((sum: number, t: any) => sum + t.rating, 0) / userTemplates.length
    : 0;

  const stats = {
    totalTemplatesShared: userTemplates.length,
    totalDownloads,
    totalEarnings,
    avgRating,
    monthlyRevenue: calculateMonthlyRevenue(userTemplates),
    updatedAt: Date.now(),
  };

  if (creatorProfile) {
    await ctx.db.patch(creatorProfile._id, stats);
  } else {
    await ctx.db.insert("creatorProfiles", {
      userId,
      whopCreatorId: undefined,
      ...stats,
      followerCount: 0,
      creatorTier: determineCreatorTier(stats),
      certificationStatus: "none",
      certificationDate: undefined,
      bestPerformingTemplate: findBestTemplate(userTemplates),
      portfolioViews: 0,
      bio: undefined,
      socialLinks: {
        twitter: undefined,
        instagram: undefined,
        whopProfile: undefined,
        website: undefined,
      },
      badges: [],
      milestones: [],
      createdAt: Date.now(),
    });
  }
}

/**
 * Calculate monthly revenue for creator
 */
function calculateMonthlyRevenue(templates: any[]): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // This would need to be calculated from billing events in a real implementation
  // For now, estimate based on recent template performance
  return templates.reduce((sum, template) => {
    if (template.updatedAt > thirtyDaysAgo) {
      return sum + (template.creatorEarnings * 0.3); // Rough monthly estimate
    }
    return sum;
  }, 0);
}

/**
 * Determine creator tier based on performance
 */
function determineCreatorTier(stats: any): string {
  if (stats.totalEarnings > 1000 && stats.avgRating > 4.5) {
    return "featured";
  } else if (stats.totalEarnings > 500 && stats.avgRating > 4.0) {
    return "established";
  } else if (stats.totalTemplatesShared > 0) {
    return "emerging";
  }
  return "new";
}

/**
 * Find best performing template
 */
function findBestTemplate(templates: any[]) {
  if (templates.length === 0) return undefined;

  return templates.reduce((best, current) => {
    const bestScore = (best.downloads * 0.5) + (best.rating * 0.3) + (best.likes * 0.2);
    const currentScore = (current.downloads * 0.5) + (current.rating * 0.3) + (current.likes * 0.2);

    return currentScore > bestScore ? current : best;
  })._id;
}

/**
 * Approve/reject community template (admin function)
 */
export const moderateCommunityTemplate = mutation({
  args: {
    templateId: v.id("communityTemplates"),
    moderatorUserId: v.string(),
    action: v.string(), // "approve", "reject", "feature"
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const moderator = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.moderatorUserId))
      .unique();

    if (!moderator) {
      throw new Error("Moderator not found");
    }

    // Check if user is admin (you'd implement proper admin checking)
    // For now, assume any user can moderate their own content

    const template = await ctx.db.get(args.templateId) as any;
    if (!template) {
      throw new Error("Template not found");
    }

    const updates: any = {
      moderatedBy: moderator._id,
      moderatedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (args.action === "approve") {
      updates.status = "approved";
    } else if (args.action === "reject") {
      updates.status = "rejected";
    } else if (args.action === "feature") {
      updates.status = "approved";
      updates.featured = true;
    }

    await ctx.db.patch(args.templateId, updates);

    // Notify creator (implementation depends on notification system)
    await ctx.db.insert("analytics", {
      userId: template.creatorId,
      sessionId: `moderation_${Date.now()}`,
      event: "template_moderation",
      category: "community",
      action: args.action,
      templateId: template.templateId,
      metadata: {
        communityTemplateId: args.templateId,
        moderatorId: moderator._id,
        reason: args.reason,
      },
      timestamp: Date.now(),
    });

    return args.templateId;
  },
});

/**
 * Get creator profile and stats
 */
export const getCreatorProfile = query({
  args: {
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      return null;
    }

    const creatorProfile = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const userTemplates = await ctx.db
      .query("communityTemplates")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    return {
      user: {
        name: user.name,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
      },
      profile: creatorProfile,
      templates: userTemplates,
      stats: {
        templatesCount: userTemplates.length,
        totalDownloads: userTemplates.reduce((sum, t) => sum + t.downloads, 0),
        totalLikes: userTemplates.reduce((sum, t) => sum + t.likes, 0),
        avgRating: userTemplates.length > 0
          ? userTemplates.reduce((sum, t) => sum + t.rating, 0) / userTemplates.length
          : 0,
      }
    };
  },
});