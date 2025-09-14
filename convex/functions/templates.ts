import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Create new template
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    subCategory: v.optional(v.string()),
    config: v.object({
      mockupType: v.string(),
      basePrompt: v.string(),
      negativePrompt: v.optional(v.string()),
      defaultSettings: v.any(),
      requiredDimensions: v.optional(v.object({
        width: v.number(),
        height: v.number(),
        aspectRatio: v.optional(v.string()),
      })),
      supportedFormats: v.array(v.string()),
    }),
    isPublic: v.boolean(),
    isPremium: v.boolean(),
    requiredTier: v.string(),
    createdBy: v.optional(v.id("users")),
    isOfficial: v.boolean(),
    tags: v.array(v.string()),
    searchKeywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new ConvexError("Template with this slug already exists");
    }
    
    const templateId = await ctx.db.insert("templates", {
      ...args,
      previewIds: [],
      usageCount: 0,
      avgRating: 0,
      totalRatings: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return templateId;
  },
});

// Update template
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    config: v.optional(v.object({
      mockupType: v.string(),
      basePrompt: v.string(),
      negativePrompt: v.optional(v.string()),
      defaultSettings: v.any(),
      requiredDimensions: v.optional(v.object({
        width: v.number(),
        height: v.number(),
        aspectRatio: v.optional(v.string()),
      })),
      supportedFormats: v.array(v.string()),
    })),
    isPublic: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    requiredTier: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    searchKeywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    const template = await ctx.db.get(id);
    if (!template) {
      throw new ConvexError("Template not found");
    }
    
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, {
      ...filteredUpdateData,
      updatedAt: Date.now(),
    });
  },
});

// Delete template
export const deleteTemplate = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new ConvexError("Template not found");
    }
    
    await ctx.db.delete(args.id);
  },
});

// Get template by ID
export const getById = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get template by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// List templates with filtering
export const list = query({
  args: {
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    search: v.optional(v.string()),
    userTier: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Apply filters and build query
    let templates;
    if (args.category) {
      templates = await ctx.db
        .query("templates")
        .withIndex("by_category", (q: any) => 
          q.eq("category", args.category).eq("subCategory", args.subCategory || undefined)
        )
        .collect();
    } else if (args.isPublic !== undefined) {
      templates = await ctx.db
        .query("templates")
        .withIndex("by_public", (q: any) => 
          q.eq("isPublic", args.isPublic).eq("isPremium", args.isPremium || false)
        )
        .collect();
    } else {
      templates = await ctx.db.query("templates").collect();
    }
    
    // Filter by user tier access
    if (args.userTier) {
      templates = templates.filter(template => {
        if (template.isPremium) {
          return ['pro', 'enterprise'].includes(args.userTier!);
        }
        return true;
      });
    }
    
    // Search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        template.searchKeywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by usage and rating
    templates.sort((a, b) => {
      // First by usage count (descending)
      const usageDiff = b.usageCount - a.usageCount;
      if (usageDiff !== 0) return usageDiff;
      
      // Then by rating (descending)
      const ratingDiff = b.avgRating - a.avgRating;
      if (ratingDiff !== 0) return ratingDiff;
      
      // Finally by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
    
    const total = templates.length;
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    
    const results = templates.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return {
      results,
      total,
      hasMore
    };
  },
});

// Get popular templates
export const getPopular = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    userTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let templates;

    if (args.category) {
      templates = await ctx.db
        .query("templates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      templates = await ctx.db
        .query("templates")
        .withIndex("by_popularity")
        .collect();
    }

    // Filter by isPublic
    templates = templates.filter(template => template.isPublic);
    
    // Filter by user tier access
    if (args.userTier) {
      templates = templates.filter(template => {
        if (template.isPremium) {
          return ['pro', 'enterprise'].includes(args.userTier!);
        }
        return true;
      });
    }
    
    // Sort by popularity (usage count * rating)
    templates.sort((a, b) => {
      const aScore = a.usageCount * Math.max(a.avgRating, 1);
      const bScore = b.usageCount * Math.max(b.avgRating, 1);
      return bScore - aScore;
    });
    
    return templates.slice(0, args.limit || 10);
  },
});

// Get templates by creator
export const getByCreator = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.creatorId))
      .order("desc")
      .take(args.limit || 20);
    
    return templates;
  },
});

// Increment template usage
export const incrementUsage = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new ConvexError("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
    });
  },
});

// Rate template
export const rateTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    userId: v.id("users"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError("Rating must be between 1 and 5");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new ConvexError("Template not found");
    }
    
    // Check if user already rated this template
    const existingRating = await ctx.db
      .query("analytics")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("templateId"), args.templateId),
          q.eq(q.field("event"), "template_rated")
        )
      )
      .first();
    
    if (existingRating) {
      throw new ConvexError("You have already rated this template");
    }
    
    // Add rating to analytics
    await ctx.db.insert("analytics", {
      userId: args.userId,
      sessionId: `rating_${Date.now()}`,
      event: "template_rated",
      category: "template",
      action: "rate",
      value: args.rating,
      templateId: args.templateId,
      timestamp: Date.now(),
    });
    
    // Update template rating
    const newTotalRatings = template.totalRatings + 1;
    const newAvgRating = ((template.avgRating * template.totalRatings) + args.rating) / newTotalRatings;
    
    await ctx.db.patch(args.templateId, {
      avgRating: Math.round(newAvgRating * 10) / 10, // Round to 1 decimal
      totalRatings: newTotalRatings,
    });
  },
});

// Search templates
export const search = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    userTier: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("templates").collect();
    
    // Filter by category
    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }
    
    // Filter by user tier
    if (args.userTier) {
      templates = templates.filter(template => {
        if (template.isPremium) {
          return ['pro', 'enterprise'].includes(args.userTier!);
        }
        return true;
      });
    }
    
    // Search filter
    const searchLower = args.query.toLowerCase();
    const searchResults = templates.filter(template => {
      const relevanceScore = calculateRelevanceScore(template, searchLower);
      return relevanceScore > 0;
    }).map(template => ({
      ...template,
      relevanceScore: calculateRelevanceScore(template, searchLower)
    }));
    
    // Sort by relevance score
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return searchResults.slice(0, args.limit || 20);
  },
});

// Get template categories
export const getCategories = query({
  args: {},
  handler: async (ctx, args) => {
    const templates = await ctx.db.query("templates")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    const categories = new Map<string, { count: number; subCategories: Set<string> }>();
    
    templates.forEach(template => {
      if (!categories.has(template.category)) {
        categories.set(template.category, { count: 0, subCategories: new Set() });
      }
      
      const categoryData = categories.get(template.category)!;
      categoryData.count++;
      
      if (template.subCategory) {
        categoryData.subCategories.add(template.subCategory);
      }
    });
    
    return Array.from(categories.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      subCategories: Array.from(data.subCategories)
    })).sort((a, b) => b.count - a.count);
  },
});

/**
 * Get user's templates for template submission
 */
export const getUserTemplates = query({
  args: {
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      return [];
    }

    // Get user's templates
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();

    return templates;
  },
});

// Helper function to calculate search relevance score
function calculateRelevanceScore(template: any, searchQuery: string): number {
  let score = 0;
  
  // Name match (highest weight)
  if (template.name.toLowerCase().includes(searchQuery)) {
    score += 10;
    if (template.name.toLowerCase() === searchQuery) {
      score += 20; // Exact match bonus
    }
  }
  
  // Description match
  if (template.description?.toLowerCase().includes(searchQuery)) {
    score += 5;
  }
  
  // Category match
  if (template.category.toLowerCase().includes(searchQuery)) {
    score += 8;
  }
  
  // Tag matches
  template.tags.forEach((tag: string) => {
    if (tag.toLowerCase().includes(searchQuery)) {
      score += 6;
      if (tag.toLowerCase() === searchQuery) {
        score += 4; // Exact tag match bonus
      }
    }
  });
  
  // Search keywords match
  template.searchKeywords.forEach((keyword: string) => {
    if (keyword.toLowerCase().includes(searchQuery)) {
      score += 7;
      if (keyword.toLowerCase() === searchQuery) {
        score += 6; // Exact keyword match bonus
      }
    }
  });
  
  // Base prompt match (lower weight)
  if (template.config.basePrompt.toLowerCase().includes(searchQuery)) {
    score += 2;
  }
  
  // Popularity boost
  if (template.usageCount > 10) {
    score += Math.min(template.usageCount / 10, 5);
  }
  
  // Rating boost
  if (template.avgRating > 3) {
    score += template.avgRating;
  }
  
  return score;
}