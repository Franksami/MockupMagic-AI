import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@whop-apps/sdk";

// Credit pack configuration - must match your actual Whop products
const CREDIT_PACK_PLANS = {
  small: {
    planId: process.env.WHOP_SMALL_CREDIT_PLAN_ID || "plan_small_100_credits",
    amount: 100,
    price: 12
  },
  medium: {
    planId: process.env.WHOP_MEDIUM_CREDIT_PLAN_ID || "plan_medium_500_credits",
    amount: 500,
    price: 50
  },
  large: {
    planId: process.env.WHOP_LARGE_CREDIT_PLAN_ID || "plan_large_1000_credits",
    amount: 1000,
    price: 90
  }
} as const;

/**
 * Create a credit purchase session
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const { userId } = await validateToken({ headers: request.headers });

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { creditAmount, price, packSize } = body;

    // Validate request data
    if (!creditAmount || !price || !packSize) {
      return NextResponse.json(
        { error: "Missing required fields: creditAmount, price, packSize" },
        { status: 400 }
      );
    }

    // Validate pack size exists
    if (!(packSize in CREDIT_PACK_PLANS)) {
      return NextResponse.json(
        { error: "Invalid pack size" },
        { status: 400 }
      );
    }

    const plan = CREDIT_PACK_PLANS[packSize as keyof typeof CREDIT_PACK_PLANS];

    // Validate amounts match expected values
    if (creditAmount !== plan.amount || price !== plan.price) {
      return NextResponse.json(
        { error: "Credit amount or price mismatch" },
        { status: 400 }
      );
    }

    // Create purchase session data
    const purchaseSession = {
      planId: plan.planId,
      metadata: {
        creditAmount,
        packSize,
        userId,
        purchaseType: "credit_pack",
        timestamp: Date.now()
      }
    };

    console.log("Created credit purchase session:", {
      userId,
      packSize,
      creditAmount,
      price
    });

    return NextResponse.json(purchaseSession);

  } catch (error) {
    console.error("Purchase credits API error:", error);

    // Handle authentication errors
    if (error?.message?.includes('token') || error?.message?.includes('auth')) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get available credit packs (for UI)
 */
export async function GET() {
  try {
    const packs = Object.entries(CREDIT_PACK_PLANS).map(([key, plan]) => ({
      id: key,
      amount: plan.amount,
      price: plan.price,
      planId: plan.planId
    }));

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Get credit packs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit packs" },
      { status: 500 }
    );
  }
}