"use client";

import { useWhop, useUserCredits, useUserPermissions } from "@/components/providers/whop-provider";
import { useFrostedUI, FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { ClientOnly, createStableClickHandler } from "@/lib/dev-utils";
import { useState, useCallback } from "react";

export function AuthTest() {
  const { whopUser, convexUser, isLoading, isAuthenticated, error, refetch } = useWhop();
  const { credits, tier } = useUserCredits();
  const permissions = useUserPermissions();
  const { showNotification } = useFrostedUI();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stable click handlers
  const handleSuccessTest = createStableClickHandler(
    () => showNotification("Success test! ✅", "success")
  );

  const handleErrorTest = createStableClickHandler(
    () => showNotification("Error test! ❌", "error")
  );

  const handleInfoTest = createStableClickHandler(
    () => showNotification("Info test! ℹ️", "info")
  );

  const handleRefresh = createStableClickHandler(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showNotification("Authentication refreshed! 🔄", "success");
    } catch (err) {
      showNotification("Refresh failed! ❌", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, { disabled: isRefreshing });

  const handleRetryAuth = createStableClickHandler(
    () => refetch()
  );

  const handleLoginInfo = createStableClickHandler(
    () => showNotification("Please use Whop login to access the app", "info")
  );

  if (isLoading) {
    return (
      <FrostedCard className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-white">Loading authentication...</span>
        </div>
      </FrostedCard>
    );
  }

  if (error) {
    return (
      <FrostedCard className="p-6 border-red-500/50">
        <div className="space-y-4">
          <h3 className="text-red-300 font-semibold">Authentication Error</h3>
          <p className="text-red-200 text-sm">{error}</p>
          <FrostedButton
            variant="primary"
            onClick={handleRetryAuth}
            className="border-red-500/50"
          >
            Retry Authentication
          </FrostedButton>
        </div>
      </FrostedCard>
    );
  }

  if (!isAuthenticated) {
    return (
      <FrostedCard className="p-6 border-yellow-500/50">
        <div className="space-y-4">
          <h3 className="text-yellow-300 font-semibold">Not Authenticated</h3>
          <p className="text-yellow-200 text-sm">
            Please log in through Whop to access MockupMagic AI.
          </p>
          <FrostedButton
            variant="primary"
            onClick={handleLoginInfo}
          >
            Login Required
          </FrostedButton>
        </div>
      </FrostedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <FrostedCard className="p-6">
        <h3 className="text-green-300 font-semibold mb-4">✅ Authentication Successful</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Whop User ID:</span>
            <span className="text-white font-mono">{whopUser?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Email:</span>
            <span className="text-white">{whopUser?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Name:</span>
            <span className="text-white">{whopUser?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Username:</span>
            <span className="text-white">{whopUser?.username}</span>
          </div>
        </div>
      </FrostedCard>

      {/* Subscription Info */}
      <FrostedCard className="p-6">
        <h3 className="text-blue-300 font-semibold mb-4">💎 Subscription Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Tier:</span>
            <span className={`font-medium ${
              tier === "pro" ? "text-purple-300" :
              tier === "growth" ? "text-blue-300" :
              "text-green-300"
            }`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Credits Remaining:</span>
            <span className="text-white font-medium">{credits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Onboarding:</span>
            <span className={convexUser?.onboardingCompleted ? "text-green-300" : "text-yellow-300"}>
              {convexUser?.onboardingCompleted ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
      </FrostedCard>

      {/* Permissions */}
      <FrostedCard className="p-6">
        <h3 className="text-purple-300 font-semibold mb-4">🔐 Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${permissions.canGenerateBasicMockups ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-gray-300">Basic Mockups</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${permissions.canUsePremiumTemplates ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-gray-300">Premium Templates</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${permissions.canGenerateBulk ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-gray-300">Bulk Generation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${permissions.canUseAPI ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-gray-300">API Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${permissions.canCreateCustomTemplates ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-gray-300">Custom Templates</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Max Concurrent Jobs:</span>
            <span className="text-white">{permissions.maxConcurrentJobs}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-300">Max File Size:</span>
            <span className="text-white">{permissions.maxFileSize}MB</span>
          </div>
        </div>
      </FrostedCard>

      {/* Test Actions */}
      <FrostedCard className="p-6">
        <h3 className="text-orange-300 font-semibold mb-4">🧪 Test Actions</h3>
        <ClientOnly fallback={<div className="text-gray-400 text-sm">Loading test buttons...</div>}>
          <div className="flex flex-wrap gap-3">
            <FrostedButton
              size="sm"
              onClick={handleSuccessTest}
            >
              ✅ Test Success
            </FrostedButton>
            <FrostedButton
              size="sm"
              variant="secondary"
              onClick={handleErrorTest}
            >
              ❌ Test Error
            </FrostedButton>
            <FrostedButton
              size="sm"
              variant="ghost"
              onClick={handleInfoTest}
            >
              ℹ️ Test Info
            </FrostedButton>
            <FrostedButton
              size="sm"
              onClick={handleRefresh}
              loading={isRefreshing}
              disabled={isRefreshing}
            >
              {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh Auth"}
            </FrostedButton>
          </div>
        </ClientOnly>
      </FrostedCard>
    </div>
  );
}