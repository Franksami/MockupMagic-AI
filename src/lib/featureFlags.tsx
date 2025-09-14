'use client';

/**
 * Feature Flag System
 * Provides safe, progressive rollout capabilities with real-time updates
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createContext, useContext, ReactNode, useMemo } from 'react';

// Feature flag types
export interface FeatureFlag {
  id: Id<'featureFlags'>;
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  userGroups?: string[];
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FeatureFlagOverride {
  userId: string;
  flagKey: string;
  enabled: boolean;
}

// Available feature flags
export enum FeatureFlagKeys {
  NEW_THEME = 'new_theme',
  GLASSMORPHISM = 'glassmorphism_ui',
  APP_SHELL = 'app_shell_redesign',
  COLLAPSIBLE_SIDEBAR = 'collapsible_sidebar',
  FLOATING_PANELS = 'floating_tool_panels',
  REAL_TIME_PREVIEW = 'real_time_preview',
  DRAG_DROP_V2 = 'drag_drop_v2',
  OKLCH_COLORS = 'oklch_color_system',
}

// Rollout strategies
export enum RolloutStrategy {
  DISABLED = 0,
  CANARY = 5,    // 5% of users
  BETA = 25,     // 25% of users
  STAGED = 50,   // 50% of users
  GENERAL = 100, // All users
}

// Feature flag context
interface FeatureFlagContextType {
  flags: Map<string, boolean>;
  isEnabled: (key: FeatureFlagKeys | string) => boolean;
  getFlag: (key: string) => FeatureFlag | undefined;
  loading: boolean;
  error?: Error;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Hash function for consistent user bucketing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Determine if user is in rollout percentage
function isUserInRollout(userId: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const userHash = hashString(userId);
  const bucket = (userHash % 100) + 1;
  return bucket <= percentage;
}

// Feature flag provider component
export function FeatureFlagProvider({
  children,
  userId,
  userGroup,
}: {
  children: ReactNode;
  userId?: string;
  userGroup?: string;
}) {
  const flags = useQuery(api.functions.featureFlags.list);
  const overrides = useQuery(api.functions.featureFlags.getUserOverrides,
    userId ? { userId } : 'skip'
  );

  const flagMap = useMemo(() => {
    const map = new Map<string, boolean>();

    if (!flags) return map;

    flags.forEach(flag => {
      let isEnabled = flag.enabled;

      // Check user group
      if (flag.userGroups && flag.userGroups.length > 0) {
        isEnabled = isEnabled && flag.userGroups.includes(userGroup || '');
      }

      // Check rollout percentage
      if (isEnabled && userId && flag.rolloutPercentage < 100) {
        isEnabled = isUserInRollout(userId, flag.rolloutPercentage);
      }

      // Check for user overrides
      const override = overrides?.find(o => o.flagKey === flag.key);
      if (override) {
        isEnabled = override.enabled;
      }

      map.set(flag.key, isEnabled);
    });

    return map;
  }, [flags, overrides, userId, userGroup]);

  const context: FeatureFlagContextType = {
    flags: flagMap,
    isEnabled: (key: FeatureFlagKeys | string) => flagMap.get(key) || false,
    getFlag: (key: string) => flags?.find(f => f.key === key),
    loading: flags === undefined,
    error: undefined,
  };

  return (
    <FeatureFlagContext.Provider value={context}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// Hook to use feature flags
export function useFeatureFlag(key: FeatureFlagKeys | string): boolean {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }
  return context.isEnabled(key);
}

// Hook to get all flags
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
}

// Admin hook for managing flags
export function useFeatureFlagAdmin() {
  const updateFlag = useMutation(api.functions.featureFlags.update);
  const createFlag = useMutation(api.featureFlags.create);
  const deleteFlag = useMutation(api.featureFlags.delete);
  const setOverride = useMutation(api.featureFlags.setUserOverride);

  return {
    updateFlag,
    createFlag,
    deleteFlag,
    setOverride,
  };
}

// Utility to check multiple flags
export function useFeatureFlagsMultiple(keys: FeatureFlagKeys[]): Record<string, boolean> {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagsMultiple must be used within FeatureFlagProvider');
  }

  return keys.reduce((acc, key) => {
    acc[key] = context.isEnabled(key);
    return acc;
  }, {} as Record<string, boolean>);
}

// HOC for feature flag gating
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: FeatureFlagKeys,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey);

    if (isEnabled) {
      return <Component {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}