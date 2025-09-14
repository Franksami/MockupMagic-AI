import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Get available courses with filtering
 */
export const getAvailableCourses = query({
  args: {
    category: v.optional(v.string()),
    accessLevel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Filter by category and build query
    let courses;
    if (args.category) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_category", (q: any) => q.eq("category", args.category))
        .collect();
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_published", (q: any) => q.eq("isPublished", true))
        .collect();
    }

    // Filter by access level
    if (args.accessLevel && args.accessLevel !== 'all') {
      courses = courses.filter(course => course.accessLevel === args.accessLevel);
    }

    // Sort by popularity (enrollment * rating)
    courses.sort((a, b) => {
      const scoreA = a.enrollmentCount * Math.max(a.avgRating, 1);
      const scoreB = b.enrollmentCount * Math.max(b.avgRating, 1);
      return scoreB - scoreA;
    });

    // Enrich with instructor data
    const enrichedCourses = await Promise.all(
      courses.slice(0, limit).map(async (course) => {
        const instructor = await ctx.db.get(course.instructorId);
        return {
          ...course,
          instructor: instructor ? {
            name: instructor.name,
            avatarUrl: instructor.avatarUrl,
            whopUserId: instructor.whopUserId,
          } : null,
        };
      })
    );

    return enrichedCourses;
  },
});

/**
 * Get user's course enrollments
 */
export const getUserEnrollments = query({
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

    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Enrich with course data
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        return {
          ...enrollment,
          course: course ? {
            title: course.title,
            slug: course.slug,
            category: course.category,
            estimatedDuration: course.estimatedDuration,
          } : null,
        };
      })
    );

    return enrichedEnrollments;
  },
});

/**
 * Enroll user in a course
 */
export const enrollInCourse = mutation({
  args: {
    whopUserId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Check access permissions
    if (course.accessLevel === 'pro' && !['growth', 'pro'].includes(user.subscriptionTier)) {
      throw new Error("Pro subscription required");
    }

    if (course.accessLevel === 'premium' && user.subscriptionTier !== 'pro') {
      throw new Error("Pro subscription required for premium courses");
    }

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .unique();

    if (existingEnrollment) {
      throw new Error("Already enrolled in this course");
    }

    // Handle payment for premium courses
    if (course.price > 0 && course.accessLevel === 'premium') {
      // Check credits or initiate payment flow
      const creditCost = Math.ceil(course.price / 10); // $1 = 0.1 credits

      if (user.creditsRemaining < creditCost) {
        throw new Error(`Insufficient credits. Need ${creditCost} credits for this course.`);
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
        type: "course_purchase",
        amount: course.price,
        currency: course.currency,
        status: "completed",
        description: `Course enrollment: ${course.title}`,
        metadata: {
          courseId: args.courseId,
          creditCost,
          accessLevel: course.accessLevel,
        },
        createdAt: Date.now(),
      });
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("courseEnrollments", {
      userId: user._id,
      courseId: args.courseId,
      progress: 0,
      currentModuleId: course.modules[0]?.id || undefined,
      currentLessonId: course.modules[0]?.lessons[0]?.id || undefined,
      completedLessons: [],
      totalTimeSpent: 0,
      lastAccessedAt: Date.now(),
      completed: false,
      completedAt: undefined,
      certificateId: undefined,
      finalScore: undefined,
      purchasePrice: course.price,
      purchaseDate: Date.now(),
      accessExpiresAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update course enrollment count
    await ctx.db.patch(args.courseId, {
      enrollmentCount: course.enrollmentCount + 1,
    });

    // Track analytics
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `course_enrollment_${Date.now()}`,
      event: "course_enrollment",
      category: "education",
      action: "enroll",
      value: course.price,
      metadata: {
        courseId: args.courseId,
        courseName: course.title,
        accessLevel: course.accessLevel,
        enrollmentId,
      },
      timestamp: Date.now(),
    });

    return enrollmentId;
  },
});

/**
 * Update course progress
 */
export const updateCourseProgress = mutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    lessonId: v.string(),
    timeSpent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const course = await ctx.db.get(enrollment.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Add lesson to completed list if not already there
    const completedLessons = [...enrollment.completedLessons];
    if (!completedLessons.includes(args.lessonId)) {
      completedLessons.push(args.lessonId);
    }

    // Calculate total lessons across all modules
    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

    // Find current lesson's module and next lesson
    let currentModuleId = enrollment.currentModuleId;
    let currentLessonId = enrollment.currentLessonId;

    for (const module of course.modules) {
      const lessonIndex = module.lessons.findIndex(l => l.id === args.lessonId);
      if (lessonIndex !== -1) {
        currentModuleId = module.id;
        // Set next lesson if available
        if (lessonIndex + 1 < module.lessons.length) {
          currentLessonId = module.lessons[lessonIndex + 1].id;
        } else {
          // Move to next module's first lesson
          const moduleIndex = course.modules.findIndex(m => m.id === module.id);
          if (moduleIndex + 1 < course.modules.length) {
            const nextModule = course.modules[moduleIndex + 1];
            currentModuleId = nextModule.id;
            currentLessonId = nextModule.lessons[0]?.id;
          }
        }
        break;
      }
    }

    const updates: any = {
      completedLessons,
      progress: Math.round(progress),
      currentModuleId,
      currentLessonId,
      lastAccessedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add time spent if provided
    if (args.timeSpent) {
      updates.totalTimeSpent = enrollment.totalTimeSpent + args.timeSpent;
    }

    // Mark as completed if 100%
    if (progress >= 100 && !enrollment.completed) {
      updates.completed = true;
      updates.completedAt = Date.now();

      // Track completion analytics
      await ctx.db.insert("analytics", {
        userId: enrollment.userId,
        sessionId: `course_completion_${Date.now()}`,
        event: "course_completion",
        category: "education",
        action: "complete",
        value: course.price,
        metadata: {
          courseId: enrollment.courseId,
          courseName: course.title,
          totalTimeSpent: updates.totalTimeSpent,
          enrollmentId: args.enrollmentId,
        },
        timestamp: Date.now(),
      });
    }

    await ctx.db.patch(args.enrollmentId, updates);

    return {
      progress: updates.progress,
      completed: updates.completed || false,
      currentModuleId: updates.currentModuleId,
      currentLessonId: updates.currentLessonId,
    };
  },
});

/**
 * Get course content for enrolled users
 */
export const getCourseContent = query({
  args: {
    courseId: v.id("courses"),
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

    // Check if user is enrolled
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .unique();

    if (!enrollment) {
      throw new Error("Not enrolled in this course");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const instructor = await ctx.db.get(course.instructorId);

    return {
      course: {
        ...course,
        instructor: instructor ? {
          name: instructor.name,
          avatarUrl: instructor.avatarUrl,
          whopUserId: instructor.whopUserId,
        } : null,
      },
      enrollment: {
        progress: enrollment.progress,
        currentModuleId: enrollment.currentModuleId,
        currentLessonId: enrollment.currentLessonId,
        completedLessons: enrollment.completedLessons,
        totalTimeSpent: enrollment.totalTimeSpent,
        completed: enrollment.completed,
      },
    };
  },
});

/**
 * Get course analytics for instructors
 */
export const getCourseAnalytics = query({
  args: {
    courseId: v.id("courses"),
    instructorUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const instructor = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.instructorUserId))
      .unique();

    if (!instructor) {
      throw new Error("Instructor not found");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course || course.instructorId !== instructor._id) {
      throw new Error("Course not found or access denied");
    }

    // Get enrollments for analytics
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const completedEnrollments = enrollments.filter(e => e.completed);
    const averageProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    const averageTimeSpent = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.totalTimeSpent, 0) / enrollments.length
      : 0;

    return {
      course: {
        title: course.title,
        enrollmentCount: course.enrollmentCount,
        avgRating: course.avgRating,
        reviewCount: course.reviewCount,
      },
      analytics: {
        totalEnrollments: enrollments.length,
        completedEnrollments: completedEnrollments.length,
        completionRate: enrollments.length > 0 ? (completedEnrollments.length / enrollments.length) * 100 : 0,
        averageProgress,
        averageTimeSpent: Math.round(averageTimeSpent),
        recentEnrollments: enrollments.filter(e =>
          e.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length,
      },
    };
  },
});