import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Get user's certification progress
 */
export const getUserCertificationProgress = query({
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

    // Get creator profile to check certification status
    const creatorProfile = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!creatorProfile) {
      return [];
    }

    // Mock certification progress data based on creator profile
    const certifications = [];

    if (creatorProfile.certificationStatus !== 'none') {
      certifications.push({
        _id: `cert_${user._id}_whop_specialist`,
        programId: 'whop-mockup-specialist',
        programTitle: 'Certified Whop Mockup Specialist',
        status: creatorProfile.certificationStatus,
        progress: creatorProfile.certificationStatus === 'certified' ? 100 :
                 creatorProfile.certificationStatus === 'in_progress' ? 75 : 0,
        certificateId: creatorProfile.certificationStatus === 'certified'
          ? `cert_${Date.now()}_whop_specialist` : undefined,
        earnedAt: creatorProfile.certificationDate,
      });
    }

    return certifications;
  },
});

/**
 * Enroll in certification program
 */
export const enrollInCertification = mutation({
  args: {
    whopUserId: v.string(),
    programId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check subscription tier for certification access
    if (user.subscriptionTier === 'starter') {
      throw new Error("Growth or Pro subscription required for certification programs");
    }

    // Get or create creator profile
    let creatorProfile = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!creatorProfile) {
      // Create creator profile
      const creatorProfileId = await ctx.db.insert("creatorProfiles", {
        userId: user._id,
        whopCreatorId: undefined,
        totalTemplatesShared: 0,
        totalDownloads: 0,
        totalEarnings: 0,
        avgRating: 0,
        followerCount: 0,
        creatorTier: "emerging",
        certificationStatus: "in_progress",
        certificationDate: undefined,
        bestPerformingTemplate: undefined,
        monthlyRevenue: 0,
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
        updatedAt: Date.now(),
      });
      
      // Get the newly created profile
      creatorProfile = await ctx.db.get(creatorProfileId);
      if (!creatorProfile) {
        throw new Error('Failed to create creator profile');
      }
    } else {
      // Update existing profile
      await ctx.db.patch(creatorProfile._id, {
        certificationStatus: "in_progress",
        updatedAt: Date.now(),
      });
    }

    // Handle payment for certification
    const certificationPrices: Record<string, number> = {
      'whop-mockup-specialist': 199,
      'conversion-optimizer': 149,
    };

    const price = certificationPrices[args.programId] || 199;
    const creditCost = Math.ceil(price / 10); // $1 = 0.1 credits

    if (user.creditsRemaining < creditCost) {
      throw new Error(`Insufficient credits. Need ${creditCost} credits for certification program.`);
    }

    // Deduct credits
    await ctx.db.patch(user._id, {
      creditsRemaining: user.creditsRemaining - creditCost,
      creditsUsedThisMonth: user.creditsUsedThisMonth + creditCost,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed + creditCost,
    });

    // Log billing event
    await ctx.db.insert("billingEvents", {
      userId: user._id,
      type: "certification_enrollment",
      amount: price,
      currency: "usd",
      status: "completed",
      description: `Certification enrollment: ${args.programId}`,
      metadata: {
        programId: args.programId,
        creditCost,
        creatorProfileId: creatorProfile._id,
      },
      createdAt: Date.now(),
    });

    // Track analytics
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `certification_enrollment_${Date.now()}`,
      event: "certification_enrollment",
      category: "education",
      action: "enroll",
      value: price,
      metadata: {
        programId: args.programId,
        userTier: user.subscriptionTier,
        creatorProfileId: creatorProfile._id,
      },
      timestamp: Date.now(),
    });

    return creatorProfile._id;
  },
});

/**
 * Complete certification program
 */
export const completeCertification = mutation({
  args: {
    whopUserId: v.string(),
    programId: v.string(),
    examScore: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const creatorProfile = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!creatorProfile || creatorProfile.certificationStatus !== 'in_progress') {
      throw new Error("Not enrolled in certification program");
    }

    // Check passing score
    const passingScores: Record<string, number> = {
      'whop-mockup-specialist': 85,
      'conversion-optimizer': 90,
    };

    const requiredScore = passingScores[args.programId] || 85;

    if (args.examScore < requiredScore) {
      throw new Error(`Exam score of ${args.examScore}% is below required ${requiredScore}%`);
    }

    // Award certification
    const certificateId = `cert_${Date.now()}_${args.programId}`;

    await ctx.db.patch(creatorProfile._id, {
      certificationStatus: "certified",
      certificationDate: Date.now(),
      badges: [...creatorProfile.badges, args.programId],
      milestones: [
        ...creatorProfile.milestones,
        {
          type: "certification_earned",
          achievedAt: Date.now(),
          value: args.examScore,
        }
      ],
      updatedAt: Date.now(),
    });

    // Track completion analytics
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `certification_completion_${Date.now()}`,
      event: "certification_completed",
      category: "education",
      action: "complete",
      value: args.examScore,
      metadata: {
        programId: args.programId,
        examScore: args.examScore,
        certificateId,
        creatorProfileId: creatorProfile._id,
      },
      timestamp: Date.now(),
    });

    return {
      certificateId,
      earnedAt: Date.now(),
      examScore: args.examScore,
    };
  },
});

/**
 * Get certification leaderboard
 */
export const getCertificationLeaderboard = query({
  args: {
    programId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let creatorProfiles = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_certification", (q) => q.eq("certificationStatus", "certified"))
      .collect();

    // Filter by program if specified
    if (args.programId) {
      creatorProfiles = creatorProfiles.filter(profile =>
        profile.badges.includes(args.programId!)
      );
    }

    // Sort by total earnings (certified creators earn more)
    creatorProfiles.sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Enrich with user data
    const leaderboard = await Promise.all(
      creatorProfiles.slice(0, limit).map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: user ? {
            name: user.name,
            avatarUrl: user.avatarUrl,
            whopUserId: user.whopUserId,
          } : null,
        };
      })
    );

    return leaderboard;
  },
});

/**
 * Verify certification status (for third-party verification)
 */
export const verifyCertification = query({
  args: {
    certificateId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find certification by scanning creator profiles
    const creatorProfiles = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_certification", (q) => q.eq("certificationStatus", "certified"))
      .collect();

    for (const profile of creatorProfiles) {
      // Check milestones for certificate ID
      const certificationMilestone = profile.milestones.find(
        milestone => milestone.type === "certification_earned"
      );

      if (certificationMilestone) {
        const user = await ctx.db.get(profile.userId);
        return {
          valid: true,
          certificateId: args.certificateId,
          holderName: user?.name || "Unknown",
          earnedAt: certificationMilestone.achievedAt,
          programBadges: profile.badges,
          verifiedAt: Date.now(),
        };
      }
    }

    return {
      valid: false,
      certificateId: args.certificateId,
      error: "Certificate not found or invalid",
    };
  },
});