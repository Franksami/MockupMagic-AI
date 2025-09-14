import { NextRequest, NextResponse } from "next/server";
import { authenticateUserServerSide } from "@/lib/whop-sdk";
import { whopSdk } from "@/lib/whop-sdk";

/**
 * Create a payment charge using Whop SDK
 * This follows Whop's official 2-step payment flow:
 * 1. Server creates charge with chargeUser()
 * 2. Returns inAppPurchase object for client confirmation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUserServerSide(request.headers);

    if (!authResult || !authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 }
      );
    }

    const { whopUser, convexUser } = authResult;

    // 2. Parse request body
    const body = await request.json();
    const {
      creditAmount,
      packSize,
      experienceId = process.env.NEXT_PUBLIC_WHOP_APP_ID
    } = body;

    // 3. Validate request data
    if (!creditAmount || !packSize) {
      return NextResponse.json(
        { error: "Missing required fields: creditAmount, packSize" },
        { status: 400 }
      );
    }

    // 4. Define credit pack pricing
    const CREDIT_PACKS = {
      small: { amount: 100, price: 12 },
      medium: { amount: 500, price: 50 },
      large: { amount: 1000, price: 90 }
    };

    const pack = CREDIT_PACKS[packSize as keyof typeof CREDIT_PACKS];

    if (!pack || pack.amount !== creditAmount) {
      return NextResponse.json(
        { error: "Invalid credit pack configuration" },
        { status: 400 }
      );
    }

    // 5. Create charge using Whop SDK
    console.log(`Creating charge for user ${whopUser.id}: ${creditAmount} credits for $${pack.price}`);

    const result = await whopSdk.payments.chargeUser({
      amount: pack.price * 100, // Whop expects amount in cents
      currency: "usd",
      userId: whopUser.id,
      // Metadata will be returned in webhook for fulfillment
      metadata: {
        creditsToPurchase: creditAmount,
        packSize: packSize,
        experienceId: experienceId,
        convexUserId: convexUser?._id,
        timestamp: Date.now()
      }
    });

    // 6. Check if charge was created successfully
    if (!result?.inAppPurchase) {
      console.error("Failed to create charge - no inAppPurchase object returned");
      throw new Error("Failed to create payment charge");
    }

    console.log(`Charge created successfully: ${result.inAppPurchase.id}`);

    // 7. Return inAppPurchase object for client-side confirmation
    return NextResponse.json(result.inAppPurchase);

  } catch (error) {
    console.error("Charge creation error:", error);

    // Handle specific error types
    if (error?.message?.includes('insufficient_funds')) {
      return NextResponse.json(
        { error: "Insufficient funds in your account" },
        { status: 402 }
      );
    }

    if (error?.message?.includes('auth') || error?.message?.includes('token')) {
      return NextResponse.json(
        { error: "Authentication failed - please log in again" },
        { status: 401 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to create payment charge",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get charge status (optional - for polling if needed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      return NextResponse.json(
        { error: "Missing chargeId parameter" },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUserServerSide(request.headers);

    if (!authResult || !authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In production, you would check the charge status here
    // For now, return a placeholder response
    return NextResponse.json({
      chargeId,
      status: "pending",
      message: "Charge status checking not yet implemented"
    });

  } catch (error) {
    console.error("Get charge status error:", error);
    return NextResponse.json(
      { error: "Failed to get charge status" },
      { status: 500 }
    );
  }
}