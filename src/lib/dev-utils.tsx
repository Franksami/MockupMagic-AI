/**
 * Development utilities to help with HMR stability and debugging
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * In development mode, reduce motion and animations that might interfere with HMR
 */
export const getMotionPrefs = () => ({
  // Reduce motion in development to prevent interference
  reduceMotion: isDevelopment,
  // Faster transitions in development
  duration: isDevelopment ? 0.1 : 0.3,
  // Simpler easing in development
  ease: isDevelopment ? "linear" : "easeOut",
});

/**
 * Debug logger that only logs in development
 */
export const devLog = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEV] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[DEV] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(`[DEV] ${message}`, ...args);
    }
  },
};

/**
 * Prevent hydration mismatches by ensuring consistent client/server state
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

import React from 'react';

/**
 * Hook to ensure components are properly mounted before rendering interactive elements
 */
export function useClientOnly() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Wrapper component that only renders children on the client
 */
interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useClientOnly();

  if (!isClient) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Enhanced click handler that prevents event bubbling issues common in development
 */
export function createStableClickHandler(
  onClick?: () => void | Promise<void>,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    disabled?: boolean
  } = {}
) {
  const { preventDefault = true, stopPropagation = true, disabled = false } = options;

  return React.useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    // Small delay to ensure DOM stability in development
    if (isDevelopment) {
      setTimeout(() => {
        onClick?.();
      }, 0);
    } else {
      onClick?.();
    }
  }, [onClick, disabled, preventDefault, stopPropagation]);
}