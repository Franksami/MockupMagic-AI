"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authenticateUser } from "@/lib/whop-sdk";

interface WhopUser {
  id: string;
  email: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface ConvexUser {
  _id: string;
  whopUserId: string;
  email: string;
  name: string;
  subscriptionTier: string;
  creditsRemaining: number;
  onboardingCompleted: boolean;
}

interface WhopContextType {
  whopUser: WhopUser | null;
  convexUser: ConvexUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const WhopContext = createContext<WhopContextType | undefined>(undefined);

interface WhopProviderProps {
  children: React.ReactNode;
}

export function WhopProvider({ children }: WhopProviderProps) {
  const [whopUser, setWhopUser] = useState<WhopUser | null>(null);
  const [convexUser, setConvexUser] = useState<ConvexUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authenticateUser();

      if (result) {
        setWhopUser(result.whopUser);
        setConvexUser(result.convexUser);
      } else {
        setWhopUser(null);
        setConvexUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      console.error("Authentication error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const refetch = async () => {
    await fetchUser();
  };

  const isAuthenticated = !!(whopUser && convexUser);

  const contextValue: WhopContextType = {
    whopUser,
    convexUser,
    isLoading,
    isAuthenticated,
    error,
    refetch,
  };

  return (
    <WhopContext.Provider value={contextValue}>
      {children}
    </WhopContext.Provider>
  );
}

export function useWhop() {
  const context = useContext(WhopContext);
  if (context === undefined) {
    throw new Error("useWhop must be used within a WhopProvider");
  }
  return context;
}

export function useWhopUser() {
  const { whopUser, isLoading, isAuthenticated } = useWhop();
  return { whopUser, isLoading, isAuthenticated };
}

export function useConvexUser() {
  const { convexUser, isLoading, isAuthenticated } = useWhop();
  return { convexUser, isLoading, isAuthenticated };
}

export function useUserCredits() {
  const { convexUser } = useWhop();
  return {
    credits: convexUser?.creditsRemaining || 0,
    tier: convexUser?.subscriptionTier || "starter",
  };
}

export function useUserPermissions() {
  const { convexUser } = useWhop();
  const tier = convexUser?.subscriptionTier || "starter";
  
  const permissions = {
    canGenerateBasicMockups: true,
    canUsePremiumTemplates: tier !== "starter",
    canGenerateBulk: tier === "growth" || tier === "pro",
    canUseAPI: tier === "pro",
    canCreateCustomTemplates: tier === "pro",
    maxConcurrentJobs: tier === "pro" ? 10 : tier === "growth" ? 3 : 1,
    maxFileSize: tier === "pro" ? 50 : tier === "growth" ? 25 : 10, // MB
  };
  
  return permissions;
}