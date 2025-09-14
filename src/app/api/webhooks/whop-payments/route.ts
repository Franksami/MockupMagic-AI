import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * Webhook handler for Whop payment notifications
 * This endpoint receives notifications when users purchase credit packs
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Convex client
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Get request body and headers
    const body = await request.text();
    const signature = request.headers.get('whop-signature');

    // Verify webhook signature for security
    if (!verifyWhopSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const webhook = JSON.parse(body);
    console.log('Received Whop webhook:', {
      type: webhook.type,
      id: webhook.id,
      created: webhook.created
    });

    // Handle different webhook types
    if (webhook.type === 'payment.succeeded' || webhook.type === 'checkout.completed') {
      await handlePaymentSuccess(convex, webhook);
    } else if (webhook.type === 'payment.failed') {
      await handlePaymentFailure(convex, webhook);
    } else {
      console.log('Unhandled webhook type:', webhook.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment webhook
 */
async function handlePaymentSuccess(convex: ConvexHttpClient, webhook: {
  type: string;
  id: string;
  data?: {
    object?: unknown;
  };
  data: {
    id?: string;
    amount_paid?: number;
    currency?: string;
    metadata?: {
      userId?: string;
      creditAmount?: string;
      packSize?: string;
      purchaseType?: string;
    };
  };
}) {
  try {
    const payment = webhook.data?.object || webhook.data;
    const metadata = payment.metadata || {};

    // Extract purchase information from metadata
    const {
      userId,
      creditAmount,
      packSize,
      purchaseType
    } = metadata;

    // Validate required fields
    if (!userId || !creditAmount || purchaseType !== 'credit_pack') {
      console.error('Invalid payment metadata:', metadata);
      return;
    }

    const creditAmountNum = parseInt(creditAmount);
    if (isNaN(creditAmountNum) || creditAmountNum <= 0) {
      console.error('Invalid credit amount:', creditAmount);
      return;
    }

    // Check for duplicate processing using payment ID
    const paymentId = payment.id || webhook.id;
    const isDuplicate = await checkDuplicatePayment(convex, paymentId);

    if (isDuplicate) {
      console.log('Duplicate payment webhook, skipping:', paymentId);
      return;
    }

    // Add credits to user account
    const newBalance = await convex.mutation(api.auth.addCredits, {
      whopUserId: userId,
      amount: creditAmountNum,
      reason: `Credit pack purchase - ${packSize} (${creditAmountNum} credits)`
    });

    // Log the billing event
    await convex.mutation(api.billing.logBillingEvent, {
      whopUserId: userId,
      type: 'credit_purchase',
      amount: payment.amount_paid || 0,
      currency: payment.currency || 'usd',
      whopPaymentId: paymentId,
      status: 'completed',
      description: `${packSize} credit pack - ${creditAmountNum} credits`,
      metadata: {
        packSize,
        creditAmount: creditAmountNum,
        webhookId: webhook.id,
        processedAt: Date.now()
      }
    });

    console.log('Successfully processed credit purchase:', {
      userId,
      creditAmount: creditAmountNum,
      newBalance,
      paymentId
    });

  } catch (error) {
    console.error('Error processing payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment webhook
 */
async function handlePaymentFailure(convex: ConvexHttpClient, webhook: {
  type: string;
  id: string;
  data?: {
    object?: unknown;
  };
  data: {
    id?: string;
    amount?: number;
    currency?: string;
    failure_reason?: string;
    metadata?: {
      userId?: string;
      packSize?: string;
      purchaseType?: string;
    };
  };
}) {
  try {
    const payment = webhook.data?.object || webhook.data;
    const metadata = payment.metadata || {};
    const paymentId = payment.id || webhook.id;

    // Log the failed payment
    if (metadata.userId && metadata.purchaseType === 'credit_pack') {
      await convex.mutation(api.billing.logBillingEvent, {
        whopUserId: metadata.userId,
        type: 'credit_purchase',
        amount: payment.amount || 0,
        currency: payment.currency || 'usd',
        whopPaymentId: paymentId,
        status: 'failed',
        description: `Failed credit pack purchase - ${metadata.packSize}`,
        metadata: {
          failureReason: payment.failure_reason,
          webhookId: webhook.id,
          processedAt: Date.now()
        }
      });
    }

    console.log('Logged failed payment:', {
      userId: metadata.userId,
      paymentId,
      reason: payment.failure_reason
    });

  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}

/**
 * Check if payment has already been processed
 */
async function checkDuplicatePayment(convex: ConvexHttpClient, paymentId: string): Promise<boolean> {
  try {
    const existingEvent = await convex.query(api.billing.getBillingEventByPaymentId, {
      whopPaymentId: paymentId
    });
    return !!existingEvent;
  } catch (error) {
    console.error('Error checking duplicate payment:', error);
    return false;
  }
}

/**
 * Verify Whop webhook signature
 */
function verifyWhopSignature(body: string, signature: string | null): boolean {
  // In development, skip signature verification
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping webhook signature verification in development');
    return true;
  }

  if (!signature) {
    return false;
  }

  // Get webhook secret from environment
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing WHOP_WEBHOOK_SECRET environment variable');
    return false;
  }

  try {
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    // Compare signatures
    const providedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}