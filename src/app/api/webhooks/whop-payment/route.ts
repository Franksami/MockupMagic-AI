import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * Webhook endpoint for Whop payment confirmations
 * This endpoint receives payment success/failure notifications from Whop
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature for security
    const signature = request.headers.get("whop-signature");
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("WHOP_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature if provided
    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // 2. Parse webhook payload
    const payload = JSON.parse(rawBody);
    console.log("Received Whop payment webhook:", payload.type);

    // 3. Handle different webhook types
    const { type, data } = payload;

    switch (type) {
      case "payment.succeeded":
        await handlePaymentSuccess(data);
        break;

      case "payment.failed":
        await handlePaymentFailure(data);
        break;

      case "payment.refunded":
        await handlePaymentRefund(data);
        break;

      case "charge.succeeded":
        // Alternative event name for successful charge
        await handleChargeSuccess(data);
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    // 4. Return success response to Whop
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(data: any) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Extract metadata from payment
    const {
      payment_id,
      receipt_id,
      user_id,
      amount,
      currency,
      metadata
    } = data;

    console.log(`Processing successful payment ${payment_id} for user ${user_id}`);

    // Get credit amount from metadata
    const creditsToPurchase = metadata?.creditsToPurchase || 0;
    const packSize = metadata?.packSize;
    const convexUserId = metadata?.convexUserId;

    if (!creditsToPurchase || creditsToPurchase === 0) {
      console.error("No credits to purchase found in metadata");
      return;
    }

    // Add credits to user account in Convex
    await convex.mutation(api.functions.billing.addCreditsFromPayment, {
      whopUserId: user_id,
      convexUserId: convexUserId,
      creditAmount: creditsToPurchase,
      paymentId: payment_id,
      receiptId: receipt_id,
      amount: amount,
      currency: currency,
      packSize: packSize,
      metadata: metadata
    });

    console.log(`Successfully added ${creditsToPurchase} credits to user ${user_id}`);

    // Log billing event for analytics
    await convex.mutation(api.functions.billing.logBillingEvent, {
      whopUserId: user_id,
      eventType: "credit_purchase",
      amount: amount,
      currency: currency,
      creditAmount: creditsToPurchase,
      paymentId: payment_id,
      receiptId: receipt_id,
      metadata: metadata
    });

  } catch (error) {
    console.error("Failed to process payment success:", error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(data: any) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const { payment_id, user_id, error_message, metadata } = data;

    console.log(`Payment failed for user ${user_id}: ${error_message}`);

    // Log failed billing event
    await convex.mutation(api.functions.billing.logBillingEvent, {
      whopUserId: user_id,
      eventType: "payment_failed",
      paymentId: payment_id,
      errorMessage: error_message,
      metadata: metadata
    });

  } catch (error) {
    console.error("Failed to process payment failure:", error);
  }
}

/**
 * Handle payment refund
 */
async function handlePaymentRefund(data: any) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const {
      payment_id,
      refund_id,
      user_id,
      amount,
      metadata
    } = data;

    console.log(`Processing refund ${refund_id} for payment ${payment_id}`);

    // Deduct credits if they were added
    const creditAmount = metadata?.creditsToPurchase || 0;

    if (creditAmount > 0) {
      await convex.mutation(api.functions.billing.deductCreditsForRefund, {
        whopUserId: user_id,
        creditAmount: creditAmount,
        paymentId: payment_id,
        refundId: refund_id,
        reason: "payment_refunded"
      });
    }

    // Log refund event
    await convex.mutation(api.functions.billing.logBillingEvent, {
      whopUserId: user_id,
      eventType: "payment_refunded",
      paymentId: payment_id,
      refundId: refund_id,
      amount: amount,
      creditAmount: creditAmount,
      metadata: metadata
    });

  } catch (error) {
    console.error("Failed to process refund:", error);
  }
}

/**
 * Handle successful charge (alternative event name)
 */
async function handleChargeSuccess(data: any) {
  // Treat charge success the same as payment success
  await handlePaymentSuccess(data);
}

/**
 * GET endpoint to verify webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    status: "ready",
    endpoint: "/api/webhooks/whop-payment",
    configured: !!process.env.WHOP_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
}