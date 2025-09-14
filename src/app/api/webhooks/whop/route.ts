import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import crypto from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Whop webhook payload interface
interface WhopWebhookPayload {
  type: string;
  data: {
    id: string;
    user_id: string;
    status: string;
    product?: {
      id: string;
      name: string;
      tier?: string;
    };
    subscription?: {
      id: string;
      tier: string;
    };
    payment?: {
      amount: number;
      currency: string;
      status: string;
    };
  };
  created_at: string;
}

// Verify webhook signature
function verifyWhopSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-whop-signature');

    // Verify webhook signature
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('WHOP_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    if (!verifyWhopSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhook: WhopWebhookPayload = JSON.parse(rawBody);

    console.log('Received Whop webhook:', {
      type: webhook.type,
      userId: webhook.data.user_id,
      status: webhook.data.status
    });

    // Handle different webhook events
    switch (webhook.type) {
      case 'membership_went_valid':
        await handleMembershipCreated(webhook);
        break;
        
      case 'membership_metadata_updated':
        await handleMembershipUpdated(webhook);
        break;
        
      case 'membership_went_invalid':
      case 'membership_cancel_at_period_end_changed':
        await handleMembershipDeleted(webhook);
        break;
        
      case 'payment_succeeded':
        await handlePaymentSucceeded(webhook);
        break;
        
      case 'payment_failed':
      case 'payment_pending':
        await handlePaymentFailed(webhook);
        break;
        
      default:
        console.log('Unhandled webhook type:', webhook.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Whop webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle membership creation
async function handleMembershipCreated(webhook: WhopWebhookPayload) {
  console.log(`New membership created for user: ${webhook.data.user_id}`);
  
  try {
    // Update user subscription in Convex
    await convex.mutation(api.auth.updateUserSubscription, {
      whopUserId: webhook.data.user_id,
      subscriptionData: {
        tier: webhook.data.product?.tier || webhook.data.subscription?.tier || 'starter',
        subscriptionId: webhook.data.id,
        isActive: webhook.data.status === 'active'
      }
    });

    // Add welcome credits
    const welcomeCredits = getWelcomeCredits(webhook.data.product?.tier || 'starter');
    if (welcomeCredits > 0) {
      await convex.mutation(api.auth.addCredits, {
        whopUserId: webhook.data.user_id,
        amount: welcomeCredits,
        reason: 'welcome_bonus'
      });
    }

    console.log(`Successfully processed membership creation for user: ${webhook.data.user_id}`);
  } catch (error) {
    console.error('Error processing membership creation:', error);
    throw error;
  }
}

// Handle membership updates
async function handleMembershipUpdated(webhook: WhopWebhookPayload) {
  console.log(`Membership updated for user: ${webhook.data.user_id}`);
  
  try {
    await convex.mutation(api.auth.updateUserSubscription, {
      whopUserId: webhook.data.user_id,
      subscriptionData: {
        tier: webhook.data.product?.tier || webhook.data.subscription?.tier || 'starter',
        subscriptionId: webhook.data.id,
        isActive: webhook.data.status === 'active'
      }
    });

    console.log(`Successfully processed membership update for user: ${webhook.data.user_id}`);
  } catch (error) {
    console.error('Error processing membership update:', error);
    throw error;
  }
}

// Handle membership deletion
async function handleMembershipDeleted(webhook: WhopWebhookPayload) {
  console.log(`Membership deleted for user: ${webhook.data.user_id}`);
  
  try {
    // Downgrade to starter tier
    await convex.mutation(api.auth.updateUserSubscription, {
      whopUserId: webhook.data.user_id,
      subscriptionData: {
        tier: 'starter',
        subscriptionId: null,
        isActive: false
      }
    });

    console.log(`Successfully processed membership deletion for user: ${webhook.data.user_id}`);
  } catch (error) {
    console.error('Error processing membership deletion:', error);
    throw error;
  }
}

// Handle successful payments
async function handlePaymentSucceeded(webhook: WhopWebhookPayload) {
  console.log(`Payment succeeded for user: ${webhook.data.user_id}`);
  
  try {
    // Log billing event
    await convex.mutation(api.functions.users.logBillingEvent, {
      whopUserId: webhook.data.user_id,
      type: 'payment_succeeded',
      amount: webhook.data.payment?.amount || 0,
      currency: webhook.data.payment?.currency || 'USD',
      description: `Payment for ${webhook.data.product?.name || 'subscription'}`,
      metadata: {
        whopPaymentId: webhook.data.id,
        productId: webhook.data.product?.id
      }
    });

    console.log(`Successfully processed payment success for user: ${webhook.data.user_id}`);
  } catch (error) {
    console.error('Error processing payment success:', error);
    throw error;
  }
}

// Handle failed payments
async function handlePaymentFailed(webhook: WhopWebhookPayload) {
  console.log(`Payment failed for user: ${webhook.data.user_id}`);
  
  try {
    // Log billing event
    await convex.mutation(api.functions.users.logBillingEvent, {
      whopUserId: webhook.data.user_id,
      type: 'payment_failed',
      amount: webhook.data.payment?.amount || 0,
      currency: webhook.data.payment?.currency || 'USD',
      description: `Failed payment for ${webhook.data.product?.name || 'subscription'}`,
      metadata: {
        whopPaymentId: webhook.data.id,
        productId: webhook.data.product?.id
      }
    });

    console.log(`Successfully processed payment failure for user: ${webhook.data.user_id}`);
  } catch (error) {
    console.error('Error processing payment failure:', error);
    throw error;
  }
}

// Get welcome credits based on tier
function getWelcomeCredits(tier: string): number {
  const creditMap: Record<string, number> = {
    starter: 5,
    growth: 25,
    pro: 100,
    enterprise: 200
  };
  return creditMap[tier] || 5;
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'whop-webhook'
  });
}
