// convex/schema.ts - Complete Production Schema
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Enhanced User Management
  users: defineTable({
    whopUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    subscriptionTier: v.string(),
    subscriptionId: v.optional(v.string()),
    whopCustomerId: v.optional(v.string()),
    creditsRemaining: v.number(),
    creditsUsedThisMonth: v.number(),
    lifetimeCreditsUsed: v.number(),
    onboardingCompleted: v.boolean(),
    preferences: v.object({
      defaultStyle: v.optional(v.string()),
      autoSaveEnabled: v.boolean(),
      emailNotifications: v.boolean(),
      webhookUrl: v.optional(v.string()),
    }),
    metadata: v.object({
      source: v.optional(v.string()), // "organic", "referral", "paid"
      referralCode: v.optional(v.string()),
      utm: v.optional(v.any()),
    }),
    limits: v.object({
      maxFileSize: v.number(), // in MB
      maxConcurrentJobs: v.number(),
      apiRateLimit: v.number(), // requests per minute
    }),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    lastSyncedAt: v.number(),
  })
    .index("by_whop_id", ["whopUserId"])
    .index("by_email", ["email"])
    .index("by_whop_customer", ["whopCustomerId"])
    .index("by_activity", ["lastActiveAt"]),

  // AI Mockup Generation with Enhanced Tracking
  mockups: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    whopProductId: v.optional(v.string()),
    sourceImageId: v.optional(v.id("_storage")),
    generatedImageId: v.optional(v.id("_storage")),
    thumbnailId: v.optional(v.id("_storage")),
    
    // Generation Details
    mockupType: v.string(),
    templateId: v.optional(v.id("templates")),
    prompt: v.string(),
    enhancedPrompt: v.optional(v.string()), // After prompt engineering
    modelVersion: v.string(), // Track SDXL version
    
    // Advanced Settings
    settings: v.object({
      background: v.optional(v.string()),
      lighting: v.optional(v.string()),
      angle: v.optional(v.number()),
      style: v.optional(v.string()),
      quality: v.string(), // "draft", "standard", "premium"
      resolution: v.object({
        width: v.number(),
        height: v.number(),
      }),
      colorCorrection: v.optional(v.boolean()),
      removeBackground: v.optional(v.boolean()),
    }),
    
    // Performance Metrics
    generationTimeMs: v.number(),
    queueTimeMs: v.optional(v.number()),
    processingSteps: v.number(),
    
    // Status and Error Handling
    status: v.string(),
    error: v.optional(v.string()),
    retryCount: v.number(),
    
    // Analytics
    downloads: v.number(),
    shares: v.number(),
    rating: v.optional(v.number()),
    
    // Metadata
    metadata: v.optional(v.any()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_whop_product", ["whopProductId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_public", ["isPublic", "rating"]),

  // Template System with Categories
  templates: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    subCategory: v.optional(v.string()),
    thumbnailId: v.optional(v.id("_storage")),
    previewIds: v.array(v.id("_storage")),
    
    // Template Configuration
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
    
    // Access Control
    isPublic: v.boolean(),
    isPremium: v.boolean(),
    requiredTier: v.string(), // "starter", "growth", "pro"
    
    // Creator Info
    createdBy: v.optional(v.id("users")),
    isOfficial: v.boolean(),
    
    // Usage Analytics
    usageCount: v.number(),
    avgRating: v.number(),
    totalRatings: v.number(),
    
    // Metadata
    tags: v.array(v.string()),
    searchKeywords: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category", "subCategory"])
    .index("by_public", ["isPublic", "isPremium"])
    .index("by_creator", ["createdBy"])
    .index("by_popularity", ["usageCount", "avgRating"]),

  // Project Management
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    whopProductId: v.optional(v.string()),
    mockupIds: v.array(v.id("mockups")),
    isArchived: v.boolean(),
    shareSettings: v.object({
      isPublic: v.boolean(),
      shareToken: v.optional(v.string()),
      password: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_whop_product", ["whopProductId"])
    .index("by_share_token", ["shareSettings.shareToken"]),

  // Advanced Queue System
  generationJobs: defineTable({
    userId: v.id("users"),
    mockupId: v.id("mockups"),
    replicateId: v.optional(v.string()),
    
    // Job Configuration
    type: v.string(), // "generation", "variation", "upscale"
    status: v.string(),
    priority: v.number(),
    
    // Execution Details
    attempts: v.number(),
    maxAttempts: v.number(),
    nextRetryAt: v.optional(v.number()),
    
    // Timing
    queuedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    
    // Resources
    estimatedCredits: v.number(),
    actualCredits: v.optional(v.number()),
    
    // Error Tracking
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()),
    
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_status_priority", ["status", "priority"])
    .index("by_user", ["userId"])
    .index("by_replicate", ["replicateId"])
    .index("by_retry", ["nextRetryAt"]),

  // Comprehensive Analytics
  analytics: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    
    // Event Tracking
    event: v.string(),
    category: v.string(),
    action: v.optional(v.string()),
    label: v.optional(v.string()),
    value: v.optional(v.number()),
    
    // Context
    mockupId: v.optional(v.id("mockups")),
    templateId: v.optional(v.id("templates")),
    projectId: v.optional(v.id("projects")),
    whopProductId: v.optional(v.string()),
    
    // Performance
    duration: v.optional(v.number()),
    
    // User Journey
    referrer: v.optional(v.string()),
    utmParams: v.optional(v.any()),
    
    // Device/Browser Info
    userAgent: v.optional(v.string()),
    viewport: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    
    // Metadata
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_user_time", ["userId", "timestamp"])
    .index("by_session", ["sessionId"])
    .index("by_event", ["event", "category"])
    .index("by_mockup", ["mockupId"]),

  // Whop Integration Tracking
  whopIntegrations: defineTable({
    userId: v.id("users"),
    whopProductId: v.string(),
    productName: v.string(),
    productType: v.string(), // "digital", "physical", "course", "membership"
    
    // Sync Status
    syncEnabled: v.boolean(),
    lastSyncedAt: v.number(),
    syncFrequency: v.string(), // "realtime", "hourly", "daily"
    
    // Generated Assets
    syncedMockups: v.array(v.id("mockups")),
    autoGenerateEnabled: v.boolean(),
    autoGenerateTemplates: v.array(v.id("templates")),
    
    // Performance Metrics
    metrics: v.object({
      conversionBefore: v.optional(v.number()),
      conversionAfter: v.optional(v.number()),
      viewsIncrease: v.optional(v.number()),
      salesIncrease: v.optional(v.number()),
    }),
    
    // Settings
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_whop_id", ["whopProductId"])
    .index("by_sync", ["syncEnabled", "lastSyncedAt"]),

  // Billing and Usage
  billingEvents: defineTable({
    userId: v.id("users"),
    type: v.string(), // "subscription", "credit_purchase", "overage"
    amount: v.number(),
    currency: v.string(),
    whopPaymentId: v.optional(v.string()),
    whopTransactionId: v.optional(v.string()),
    status: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_whop_payment", ["whopPaymentId"])
    .index("by_whop_transaction", ["whopTransactionId"])
    .index("by_created", ["createdAt"]),

  // Feature Flags and Experiments (Enhanced for Theme Migration)
  featureFlags: defineTable({
    key: v.string(), // Unique identifier for the flag
    name: v.optional(v.string()), // Human-readable name
    description: v.optional(v.string()),
    enabled: v.boolean(),
    rolloutPercentage: v.number(), // 0-100
    userGroups: v.optional(v.array(v.string())), // Target specific user groups
    targetedUserIds: v.optional(v.array(v.id("users"))),
    targetedTiers: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_enabled", ["enabled"])
    .index("by_rollout", ["enabled", "rolloutPercentage"]),

  // Feature Flag User Overrides
  featureFlagOverrides: defineTable({
    userId: v.string(), // Can be whopUserId for flexibility
    flagId: v.id("featureFlags"),
    flagKey: v.string(), // Redundant but useful for queries
    enabled: v.boolean(),
    reason: v.optional(v.string()), // Why override was applied
    expiresAt: v.optional(v.number()), // Temporary overrides
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_flag", ["flagId"])
    .index("by_user_flag", ["userId", "flagKey"]),

  // Community Template Sharing (Phase 2)
  communityTemplates: defineTable({
    templateId: v.id("templates"),
    creatorId: v.id("users"),
    whopCommunityId: v.optional(v.string()),

    // Sharing Details
    title: v.string(),
    description: v.string(),
    shareType: v.string(), // "free", "premium", "exclusive"

    // Community Engagement
    likes: v.number(),
    downloads: v.number(),
    shares: v.number(),
    rating: v.number(),
    reviewCount: v.number(),

    // Revenue Sharing
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    creatorEarnings: v.number(),
    platformCommission: v.number(),

    // Content Moderation
    status: v.string(), // "pending", "approved", "rejected", "featured"
    moderatedBy: v.optional(v.id("users")),
    moderatedAt: v.optional(v.number()),

    // Performance Tracking
    conversionData: v.object({
      beforeConversion: v.optional(v.number()),
      afterConversion: v.optional(v.number()),
      improvementPercent: v.optional(v.number()),
      storeType: v.optional(v.string()),
      sampleSize: v.optional(v.number()),
    }),

    // Metadata
    tags: v.array(v.string()),
    storeCategories: v.array(v.string()), // Whop store categories
    featured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_template", ["templateId"])
    .index("by_whop_community", ["whopCommunityId"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured", "rating"])
    .index("by_popularity", ["downloads", "rating"]),

  // Creator Profiles and Achievements (Phase 2)
  creatorProfiles: defineTable({
    userId: v.id("users"),
    whopCreatorId: v.optional(v.string()),

    // Creator Stats
    totalTemplatesShared: v.number(),
    totalDownloads: v.number(),
    totalEarnings: v.number(),
    avgRating: v.number(),
    followerCount: v.number(),

    // Creator Tiers
    creatorTier: v.string(), // "emerging", "established", "featured", "certified"
    certificationStatus: v.string(), // "none", "in_progress", "certified"
    certificationDate: v.optional(v.number()),

    // Success Metrics
    bestPerformingTemplate: v.optional(v.id("communityTemplates")),
    monthlyRevenue: v.number(),
    portfolioViews: v.number(),

    // Community Engagement
    bio: v.optional(v.string()),
    socialLinks: v.object({
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      whopProfile: v.optional(v.string()),
      website: v.optional(v.string()),
    }),

    // Achievements
    badges: v.array(v.string()),
    milestones: v.array(v.object({
      type: v.string(),
      achievedAt: v.number(),
      value: v.number(),
    })),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_whop_creator", ["whopCreatorId"])
    .index("by_tier", ["creatorTier"])
    .index("by_certification", ["certificationStatus"])
    .index("by_earnings", ["totalEarnings"]),

  // Educational Content (Phase 2)
  courses: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    instructorId: v.id("users"),

    // Course Structure
    modules: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      lessons: v.array(v.object({
        id: v.string(),
        title: v.string(),
        type: v.string(), // "video", "text", "exercise", "template"
        content: v.string(),
        duration: v.optional(v.number()),
        resources: v.optional(v.array(v.string())),
      })),
      order: v.number(),
    })),

    // Pricing and Access
    price: v.number(),
    currency: v.string(),
    accessLevel: v.string(), // "free", "pro", "certified", "premium"

    // Engagement Metrics
    enrollmentCount: v.number(),
    completionRate: v.number(),
    avgRating: v.number(),
    reviewCount: v.number(),

    // Content Details
    thumbnailId: v.optional(v.id("_storage")),
    previewVideoId: v.optional(v.id("_storage")),
    difficulty: v.string(), // "beginner", "intermediate", "advanced"
    estimatedDuration: v.number(), // minutes

    // Publishing
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    category: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_instructor", ["instructorId"])
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished", "publishedAt"])
    .index("by_category", ["category", "difficulty"])
    .index("by_access_level", ["accessLevel"])
    .index("by_popularity", ["enrollmentCount", "avgRating"]),

  // Course Enrollments (Phase 2)
  courseEnrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),

    // Progress Tracking
    progress: v.number(), // 0-100
    currentModuleId: v.optional(v.string()),
    currentLessonId: v.optional(v.string()),
    completedLessons: v.array(v.string()),

    // Engagement Metrics
    totalTimeSpent: v.number(), // minutes
    lastAccessedAt: v.number(),

    // Completion and Certification
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    certificateId: v.optional(v.string()),
    finalScore: v.optional(v.number()),

    // Purchase Info
    purchasePrice: v.number(),
    purchaseDate: v.number(),
    accessExpiresAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_completion", ["completed", "completedAt"])
    .index("by_progress", ["progress"])
    .index("by_access", ["lastAccessedAt"]),

  // Whop Store Analytics (Phase 2)
  whopStoreAnalytics: defineTable({
    userId: v.id("users"),
    whopStoreId: v.string(),
    mockupId: v.optional(v.id("mockups")),
    templateId: v.optional(v.id("communityTemplates")),

    // Performance Metrics
    metric: v.string(), // "conversion_rate", "page_views", "sales", "engagement"
    beforeValue: v.number(),
    afterValue: v.number(),
    improvementPercent: v.number(),

    // Context
    measurementPeriod: v.object({
      startDate: v.number(),
      endDate: v.number(),
      durationDays: v.number(),
    }),

    // Attribution
    mockupAppliedAt: v.number(),
    storeCategory: v.string(),
    productCount: v.number(),

    // Validation
    verified: v.boolean(),
    verifiedBy: v.optional(v.id("users")),

    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_store", ["whopStoreId"])
    .index("by_mockup", ["mockupId"])
    .index("by_metric", ["metric", "improvementPercent"])
    .index("by_verified", ["verified"])
    .index("by_period", ["measurementPeriod.startDate"]),

  // File Storage Management
  files: defineTable({
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    userId: v.id("users"),
    uploadedAt: v.number(),
    updatedAt: v.optional(v.number()),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_storage_id", ["storageId"])
    .index("by_content_type", ["contentType"])
    .index("by_uploaded", ["uploadedAt"]),
});