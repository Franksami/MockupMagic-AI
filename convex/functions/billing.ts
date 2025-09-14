import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Log a billing event (purchase, refund, etc.)
 */
export const logBillingEvent = mutation({
  args: {
    whopUserId: v.string(),
    type: v.string(), // "credit_purchase", "subscription", "refund", etc.
    amount: v.number(),
    currency: v.string(),
    whopPaymentId: v.optional(v.string()),
    status: v.string(), // "completed", "failed", "pending", etc.
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get user to link the billing event
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.whopUserId}`);
    }

    // Create billing event
    const billingEventId = await ctx.db.insert("billingEvents", {
      userId: user._id,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      whopPaymentId: args.whopPaymentId,
      status: args.status,
      description: args.description,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });

    // Log analytics event for billing
    await ctx.db.insert("analytics", {
      userId: user._id,
      sessionId: `billing_${Date.now()}`,
      event: "billing_event",
      category: "billing",
      action: args.type,
      label: args.status,
      value: args.amount,
      metadata: {
        billingEventId,
        whopPaymentId: args.whopPaymentId,
        currency: args.currency,
        description: args.description,
      },
      timestamp: Date.now(),
    });

    return billingEventId;
  },
});

/**
 * Get billing event by payment ID (for duplicate checking)
 */
export const getBillingEventByPaymentId = query({
  args: {
    whopPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billingEvents")
      .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.whopPaymentId))
      .first();
  },
});

/**
 * Get user's billing history
 */
export const getUserBillingHistory = query({
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

    const limit = args.limit || 20;

    return await ctx.db
      .query("billingEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get user's total spending
 */
export const getUserTotalSpending = query({
  args: {
    whopUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .unique();

    if (!user) {
      return { total: 0, currency: "usd", completedTransactions: 0 };
    }

    const billingEvents = await ctx.db
      .query("billingEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completedEvents = billingEvents.filter(event => event.status === "completed");
    const total = completedEvents.reduce((sum, event) => sum + event.amount, 0);

    return {
      total,
      currency: completedEvents[0]?.currency || "usd",
      completedTransactions: completedEvents.length,
      totalTransactions: billingEvents.length,
    };
  },
});

/**
 * Get billing analytics for admin dashboard
 */
export const getBillingAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const endDate = args.endDate || Date.now();

    const billingEvents = await ctx.db
      .query("billingEvents")
      .withIndex("by_created", (q) =>
        q.gte("createdAt", startDate).lte("createdAt", endDate)
      )
      .collect();

    const completedEvents = billingEvents.filter(event => event.status === "completed");
    const failedEvents = billingEvents.filter(event => event.status === "failed");

    const totalRevenue = completedEvents.reduce((sum, event) => sum + event.amount, 0);
    const creditPurchases = completedEvents.filter(event => event.type === "credit_purchase");

    return {
      totalRevenue,
      totalTransactions: billingEvents.length,
      completedTransactions: completedEvents.length,
      failedTransactions: failedEvents.length,
      successRate: billingEvents.length > 0 ? (completedEvents.length / billingEvents.length) * 100 : 0,
      creditPurchases: {
        count: creditPurchases.length,
        revenue: creditPurchases.reduce((sum, event) => sum + event.amount, 0),
      },
      averageTransactionValue: completedEvents.length > 0 ? totalRevenue / completedEvents.length : 0,
    };
  },
});

/**
 * Update billing event status (for refunds, chargebacks, etc.)
 */
export const updateBillingEventStatus = mutation({
  args: {
    billingEventId: v.id("billingEvents"),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const billingEvent = await ctx.db.get(args.billingEventId);

    if (!billingEvent) {
      throw new Error("Billing event not found");
    }

    await ctx.db.patch(args.billingEventId, {
      status: args.status,
      metadata: {
        ...billingEvent.metadata,
        ...args.metadata,
        updatedAt: Date.now(),
      },
    });

    return args.billingEventId;
  },
});

/**
 * Add credits to user account from successful payment
 * This is called by the webhook when a payment succeeds
 */
export const addCreditsFromPayment = mutation({
  args: {
    whopUserId: v.string(),
    convexUserId: v.optional(v.string()),
    creditAmount: v.number(),
    paymentId: v.string(),
    receiptId: v.string(),
    amount: v.number(),
    currency: v.string(),
    packSize: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Find user by Whop ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .first();

    if (!user) {
      throw new Error(`User not found for Whop ID: ${args.whopUserId}`);
    }

    // Check if this payment was already processed (idempotency)
    const existingPayment = await ctx.db
      .query("billingEvents")
      .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.paymentId))
      .first();

    if (existingPayment && existingPayment.type === "credit_purchase" && existingPayment.status === "completed") {
      console.log(`Payment ${args.paymentId} already processed, skipping`);
      return { success: true, alreadyProcessed: true };
    }

    // Update user credits
    const newCredits = (user.creditsRemaining || 0) + args.creditAmount;
    await ctx.db.patch(user._id, {
      creditsRemaining: newCredits,
      // lastCreditPurchase field may need to be added to schema
    });

    // Log the billing event
    await ctx.db.insert("billingEvents", {
      userId: user._id,
      type: "credit_purchase",
      amount: args.amount,
      currency: args.currency,
      whopPaymentId: args.paymentId,
      status: "completed",
      description: `Purchased ${args.creditAmount} credits (${args.packSize || 'custom'} pack)`,
      metadata: {
        ...args.metadata,
        creditAmount: args.creditAmount,
        packSize: args.packSize,
        receiptId: args.receiptId,
      },
      createdAt: Date.now(),
    });

    console.log(`Added ${args.creditAmount} credits to user ${user.email}. New balance: ${newCredits}`);

    return { success: true, newBalance: newCredits };
  },
});

/**
 * Deduct credits for refund
 */
export const deductCreditsForRefund = mutation({
  args: {
    whopUserId: v.string(),
    creditAmount: v.number(),
    paymentId: v.string(),
    refundId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId))
      .first();

    if (!user) {
      throw new Error(`User not found for Whop ID: ${args.whopUserId}`);
    }

    // Calculate new credit balance (don't go below 0)
    const currentCredits = user.creditsRemaining || 0;
    const newCredits = Math.max(0, currentCredits - args.creditAmount);
    const actualDeducted = currentCredits - newCredits;

    // Update user credits
    await ctx.db.patch(user._id, {
      creditsRemaining: newCredits,
    });

    // Log the refund event
    await ctx.db.insert("billingEvents", {
      userId: user._id,
      type: "refund",
      amount: -args.creditAmount, // Negative to indicate refund
      currency: "credits",
      whopPaymentId: args.paymentId,
      status: "completed",
      description: `Refunded ${actualDeducted} credits (Refund ID: ${args.refundId})`,
      metadata: {
        refundId: args.refundId,
        reason: args.reason,
        creditsDeducted: actualDeducted,
        originalPaymentId: args.paymentId,
      },
      createdAt: Date.now(),
    });

    console.log(`Deducted ${actualDeducted} credits from user ${user.email} for refund. New balance: ${newCredits}`);

    return {
      success: true,
      creditsDeducted: actualDeducted,
      newBalance: newCredits,
    };
  },
});

/**
 * Get credit purchase statistics
 */
export const getCreditPurchaseStats = query({
  args: {
    whopUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.whopUserId) {
      // Get user-specific stats
      const user = await ctx.db
        .query("users")
        .withIndex("by_whop_id", (q) => q.eq("whopUserId", args.whopUserId!))
        .first();

      if (!user) {
        return {
          totalPurchases: 0,
          totalCredits: 0,
          totalSpent: 0,
        };
      }

      const events = await ctx.db
        .query("billingEvents")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("type"), "credit_purchase"))
        .collect();

      const completedEvents = events.filter(e => e.status === "completed");

      return {
        totalPurchases: completedEvents.length,
        totalCredits: completedEvents.reduce((sum, e) =>
          sum + (e.metadata?.creditAmount || 0), 0
        ),
        totalSpent: completedEvents.reduce((sum, e) => sum + e.amount, 0),
      };
    }

    // Admin stats for all users
    const events = await ctx.db
      .query("billingEvents")
      .filter((q) => q.eq(q.field("type"), "credit_purchase"))
      .collect();

    const completedEvents = events.filter(e => e.status === "completed");

    return {
      totalPurchases: completedEvents.length,
      totalCredits: completedEvents.reduce((sum, e) =>
        sum + (e.metadata?.creditAmount || 0), 0
      ),
      totalRevenue: completedEvents.reduce((sum, e) => sum + e.amount, 0),
      uniqueUsers: new Set(completedEvents.map(e => e.userId)).size,
    };
  },
});