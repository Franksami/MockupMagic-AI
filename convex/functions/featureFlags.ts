/**
 * Feature Flag Convex Functions
 * Backend implementation for real-time feature flag management
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';

// List all feature flags
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('featureFlags').collect();
  },
});

// Get a specific feature flag by key
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('featureFlags')
      .filter((q) => q.eq(q.field('key'), args.key))
      .first();
  },
});

// Get user-specific overrides
export const getUserOverrides = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('featureFlagOverrides')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
  },
});

// Create a new feature flag
export const create = mutation({
  args: {
    key: v.string(),
    enabled: v.boolean(),
    rolloutPercentage: v.number(),
    userGroups: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if flag already exists
    const existing = await ctx.db
      .query('featureFlags')
      .filter((q) => q.eq(q.field('key'), args.key))
      .first();

    if (existing) {
      throw new Error(`Feature flag with key "${args.key}" already exists`);
    }

    // Create the flag
    return await ctx.db.insert('featureFlags', {
      key: args.key,
      enabled: args.enabled,
      rolloutPercentage: args.rolloutPercentage,
      userGroups: args.userGroups,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update an existing feature flag
export const update = mutation({
  args: {
    id: v.id('featureFlags'),
    enabled: v.optional(v.boolean()),
    rolloutPercentage: v.optional(v.number()),
    userGroups: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get the existing flag
    const flag = await ctx.db.get(id);
    if (!flag) {
      throw new Error('Feature flag not found');
    }

    // Update with provided fields
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a feature flag
export const deleteFlag = mutation({
  args: { id: v.id('featureFlags') },
  handler: async (ctx, args) => {
    // Delete associated overrides
    const overrides = await ctx.db
      .query('featureFlagOverrides')
      .filter((q) => q.eq(q.field('flagId'), args.id))
      .collect();

    for (const override of overrides) {
      await ctx.db.delete(override._id);
    }

    // Delete the flag
    return await ctx.db.delete(args.id);
  },
});

// Set user-specific override for a flag
export const setUserOverride = mutation({
  args: {
    userId: v.string(),
    flagKey: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get the flag
    const flag = await ctx.db
      .query('featureFlags')
      .filter((q) => q.eq(q.field('key'), args.flagKey))
      .first();

    if (!flag) {
      throw new Error(`Feature flag "${args.flagKey}" not found`);
    }

    // Check for existing override
    const existingOverride = await ctx.db
      .query('featureFlagOverrides')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('flagId'), flag._id)
        )
      )
      .first();

    if (existingOverride) {
      // Update existing override
      return await ctx.db.patch(existingOverride._id, {
        enabled: args.enabled,
        updatedAt: Date.now(),
      });
    } else {
      // Create new override
      return await ctx.db.insert('featureFlagOverrides', {
        userId: args.userId,
        flagId: flag._id,
        flagKey: args.flagKey,
        enabled: args.enabled,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Clear user overrides
export const clearUserOverrides = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const overrides = await ctx.db
      .query('featureFlagOverrides')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    for (const override of overrides) {
      await ctx.db.delete(override._id);
    }

    return { deleted: overrides.length };
  },
});

// Initialize default feature flags (run once during setup)
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultFlags = [
      {
        key: 'new_theme',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Whop Dragon Fire Orange theme migration',
      },
      {
        key: 'glassmorphism_ui',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Glass morphism UI effects',
      },
      {
        key: 'app_shell_redesign',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Professional AI tool shell interface',
      },
      {
        key: 'collapsible_sidebar',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Collapsible navigation sidebar',
      },
      {
        key: 'floating_tool_panels',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Floating tool configuration panels',
      },
      {
        key: 'real_time_preview',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Real-time mockup preview system',
      },
      {
        key: 'drag_drop_v2',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Enhanced drag and drop system',
      },
      {
        key: 'oklch_color_system',
        enabled: false,
        rolloutPercentage: 0,
        description: 'OKLCH perceptually uniform color system',
      },
    ];

    const created = [];
    for (const flag of defaultFlags) {
      // Check if already exists
      const existing = await ctx.db
        .query('featureFlags')
        .filter((q) => q.eq(q.field('key'), flag.key))
        .first();

      if (!existing) {
        const id = await ctx.db.insert('featureFlags', {
          ...flag,
          userGroups: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created.push(flag.key);
      }
    }

    return {
      message: `Initialized ${created.length} feature flags`,
      created,
    };
  },
});

// Get feature flag statistics
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const flags = await ctx.db.query('featureFlags').collect();
    const overrides = await ctx.db.query('featureFlagOverrides').collect();

    const stats = {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.enabled).length,
      totalOverrides: overrides.length,
      uniqueUsers: new Set(overrides.map(o => o.userId)).size,
      flagStats: flags.map(flag => ({
        key: flag.key,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        overrideCount: overrides.filter(o => o.flagId === flag._id).length,
      })),
    };

    return stats;
  },
});