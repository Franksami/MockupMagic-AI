import { iframeSdk } from "@/lib/iframe-sdk";
import type { WhopInAppPurchase } from "@/lib/iframe-sdk";

// Credit pack options with pricing
export const CREDIT_PACKS = {
  small: {
    amount: 100,
    price: 12,
    savings: 0,
    popular: false,
    description: "Perfect for light usage"
  },
  medium: {
    amount: 500,
    price: 50,
    savings: 10,
    popular: true,
    description: "Most popular choice"
  },
  large: {
    amount: 1000,
    price: 90,
    savings: 30,
    popular: false,
    description: "Best value for power users"
  }
} as const;

export type CreditPackSize = keyof typeof CREDIT_PACKS;

export interface PurchaseResult {
  success: boolean;
  receiptId?: string;
  error?: string;
  creditAmount?: number;
}

/**
 * Purchase credits using Whop's official 2-step payment flow:
 * 1. Server creates charge with whopSdk.payments.chargeUser()
 * 2. Client confirms payment with iframeSdk.inAppPurchase()
 */
export async function purchaseCredits(packSize: CreditPackSize): Promise<PurchaseResult> {
  try {
    const pack = CREDIT_PACKS[packSize];

    if (!pack) {
      return {
        success: false,
        error: "Invalid credit pack size"
      };
    }

    // Step 1: Create charge on server using Whop SDK
    const response = await fetch("/api/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Important for authentication
      body: JSON.stringify({
        creditAmount: pack.amount,
        packSize: packSize,
        experienceId: process.env.NEXT_PUBLIC_WHOP_APP_ID // Optional
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to create payment charge"
      };
    }

    // Get the inAppPurchase object from server
    const inAppPurchase: WhopInAppPurchase = await response.json();

    console.log("Received inAppPurchase object from server:", inAppPurchase);

    // Step 2: Open Whop payment modal with the inAppPurchase object
    const result = await iframeSdk.inAppPurchase(inAppPurchase);

    if (result.status === "ok") {
      // Success! Credits will be added via webhook
      console.log("Payment successful:", result.data);
      return {
        success: true,
        receiptId: result.data?.receipt_id,
        creditAmount: pack.amount
      };
    } else if (result.status === "cancelled") {
      return {
        success: false,
        error: "Payment was cancelled"
      };
    } else {
      return {
        success: false,
        error: result.error || "Payment failed"
      };
    }

  } catch (error) {
    console.error("Credit purchase error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * Calculate savings percentage for a credit pack
 */
export function calculateSavings(packSize: CreditPackSize): number {
  const pack = CREDIT_PACKS[packSize];
  const smallPackRate = CREDIT_PACKS.small.price / CREDIT_PACKS.small.amount;
  const packRate = pack.price / pack.amount;
  return Math.round((1 - packRate / smallPackRate) * 100);
}

/**
 * Get formatted price display for a credit pack
 */
export function getPackPriceDisplay(packSize: CreditPackSize): {
  price: string;
  perCredit: string;
  savings?: string;
} {
  const pack = CREDIT_PACKS[packSize];
  const perCredit = (pack.price / pack.amount).toFixed(3);
  const savings = calculateSavings(packSize);

  return {
    price: `$${pack.price}`,
    perCredit: `$${perCredit}/credit`,
    savings: savings > 0 ? `Save ${savings}%` : undefined
  };
}