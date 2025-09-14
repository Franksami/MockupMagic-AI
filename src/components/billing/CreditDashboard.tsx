"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { CreditPurchaseModal } from "./CreditPurchaseModal";

interface CreditDashboardProps {
  userId: string;
  className?: string;
}

export function CreditDashboard({ userId, className = "" }: CreditDashboardProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const user = useQuery(api.auth.getUserByWhopId, { whopUserId: userId });

  if (!user) {
    return (
      <LiquidGlassContainer className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-20 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </LiquidGlassContainer>
    );
  }

  const totalCreditsThisMonth = user.creditsUsedThisMonth + user.creditsRemaining;
  const usagePercent = totalCreditsThisMonth > 0
    ? (user.creditsUsedThisMonth / totalCreditsThisMonth) * 100
    : 0;

  const isLowCredits = user.creditsRemaining < 10;
  const isCriticalCredits = user.creditsRemaining < 3;

  const getTierDisplayName = (tier: string) => {
    const displayNames: Record<string, string> = {
      starter: "Starter",
      growth: "Growth",
      pro: "Pro"
    };
    return displayNames[tier] || "Starter";
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      starter: "text-gray-400",
      growth: "text-blue-400",
      pro: "text-purple-400"
    };
    return colors[tier] || "text-gray-400";
  };

  const getMonthlyAllowance = (tier: string) => {
    const allowances: Record<string, number> = {
      starter: 50,
      growth: 500,
      pro: 999999 // "Unlimited"
    };
    return allowances[tier] || 50;
  };

  const monthlyAllowance = getMonthlyAllowance(user.subscriptionTier);

  return (
    <LiquidGlassContainer className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Credit Balance</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getTierColor(user.subscriptionTier)}`}>
                {getTierDisplayName(user.subscriptionTier)} Plan
              </span>
              {user.subscriptionTier === "pro" && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  Unlimited
                </span>
              )}
            </div>
          </div>

          {/* Credits remaining - large display */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${isCriticalCredits ? 'text-red-400' : isLowCredits ? 'text-yellow-400' : 'text-white'}`}>
              {user.creditsRemaining}
            </div>
            <div className="text-sm text-gray-400">
              {user.subscriptionTier === "pro" ? "credits" : `of ${monthlyAllowance}`}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {user.subscriptionTier !== "pro" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Monthly Usage</span>
              <span>{user.creditsUsedThisMonth} used</span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  usagePercent > 90 ? 'bg-red-500' :
                  usagePercent > 75 ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>{monthlyAllowance} credits/month</span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isCriticalCredits && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-sm font-medium">
                Critical: Only {user.creditsRemaining} credits remaining
              </span>
            </div>
            <p className="text-red-200 text-xs mt-1">
              Purchase more credits to continue generating mockups
            </p>
          </div>
        )}

        {isLowCredits && !isCriticalCredits && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-300 text-sm font-medium">
                Low credits: {user.creditsRemaining} remaining
              </span>
            </div>
            <p className="text-yellow-200 text-xs mt-1">
              Consider purchasing more credits or upgrading your plan
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {(isLowCredits || user.subscriptionTier === "starter") && (
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {isLowCredits ? "Buy More Credits" : "Purchase Credit Packs"}
            </button>
          )}

          {user.subscriptionTier === "starter" && (
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
              Upgrade to Growth Plan
            </button>
          )}

          {user.subscriptionTier === "growth" && (
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
              Upgrade to Pro Plan
            </button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{user.creditsUsedThisMonth}</div>
            <div className="text-xs text-gray-400">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{user.lifetimeCreditsUsed}</div>
            <div className="text-xs text-gray-400">All Time</div>
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={(creditAmount, receiptId) => {
          console.log(`Successfully purchased ${creditAmount} credits. Receipt: ${receiptId}`);
          setShowPurchaseModal(false);
          // Note: Credits will be added via webhook, user data will update automatically via Convex real-time sync
        }}
      />
    </LiquidGlassContainer>
  );
}