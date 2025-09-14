'use client';

/**
 * Theme Provider Component
 * Manages dual theme support during migration with real-time switching
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFeatureFlag } from '@/lib/featureFlags';
import { FeatureFlagKeys } from '@/lib/featureFlags';

// Theme types
export type ThemeMode = 'orange' | 'purple';
export type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  isTransitioning: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  forceTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme transition timing
const TRANSITION_DURATION = 100; // ms

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Check feature flags
  const isNewThemeEnabled = useFeatureFlag(FeatureFlagKeys.NEW_THEME);
  const isOklchEnabled = useFeatureFlag(FeatureFlagKeys.OKLCH_COLORS);

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>('purple');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userOverride, setUserOverride] = useState<ThemeMode | null>(null);

  // Initialize theme based on feature flags and user preference
  useEffect(() => {
    // Check for user override in localStorage
    const savedTheme = localStorage.getItem('mockupmagic-theme') as ThemeMode | null;
    if (savedTheme) {
      setUserOverride(savedTheme);
      setTheme(savedTheme);
    } else if (isNewThemeEnabled) {
      setTheme('orange');
    }

    // Check color scheme preference
    const savedScheme = localStorage.getItem('mockupmagic-color-scheme') as ColorScheme | null;
    if (savedScheme) {
      setColorScheme(savedScheme);
    }
  }, [isNewThemeEnabled]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Start transition
    setIsTransitioning(true);

    // Remove old theme classes
    root.classList.remove('theme-orange', 'theme-purple');

    // Add new theme class
    root.classList.add(`theme-${theme}`);

    // Add OKLCH support class if enabled
    if (isOklchEnabled) {
      root.classList.add('oklch-colors');
    } else {
      root.classList.remove('oklch-colors');
    }

    // Add transition class for smooth color changes
    root.classList.add('theme-transition');

    // End transition
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      root.classList.remove('theme-transition');
    }, TRANSITION_DURATION);

    return () => clearTimeout(timer);
  }, [theme, isOklchEnabled]);

  // Handle color scheme changes
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyColorScheme = (scheme: ColorScheme) => {
      root.classList.remove('light', 'dark');

      if (scheme === 'system') {
        const systemPreference = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(systemPreference);
      } else {
        root.classList.add(scheme);
      }
    };

    applyColorScheme(colorScheme);

    // Listen for system preference changes
    if (colorScheme === 'system') {
      const handleChange = (e: MediaQueryListEvent) => {
        applyColorScheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [colorScheme]);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'orange' ? 'purple' : 'orange';
    setTheme(newTheme);
    setUserOverride(newTheme);
    localStorage.setItem('mockupmagic-theme', newTheme);

    // Track theme change
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'theme_change', {
        from_theme: theme,
        to_theme: newTheme,
      });
    }
  };

  // Force theme (for testing)
  const forceTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setUserOverride(newTheme);
    localStorage.setItem('mockupmagic-theme', newTheme);
  };

  // Set color scheme
  const handleSetColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem('mockupmagic-color-scheme', scheme);
  };

  const value: ThemeContextType = {
    theme,
    colorScheme,
    isTransitioning,
    toggleTheme,
    setColorScheme: handleSetColorScheme,
    forceTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Performance monitoring */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary-500 z-50 animate-pulse" />
      )}
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle() {
  const { theme, toggleTheme, isTransitioning } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-neutral-700 transition-colors"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full
          transition-transform duration-200 ease-in-out
          ${theme === 'orange'
            ? 'translate-x-6 bg-primary-500'
            : 'translate-x-1 bg-purple-500'
          }
        `}
      />
    </button>
  );
}

// Color scheme selector
export function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div className="flex gap-2">
      {(['light', 'dark', 'system'] as ColorScheme[]).map((scheme) => (
        <button
          key={scheme}
          onClick={() => setColorScheme(scheme)}
          className={`
            px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${colorScheme === scheme
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
            }
          `}
        >
          {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
        </button>
      ))}
    </div>
  );
}

// Utility component for conditional theme rendering
export function ThemeConditional({
  orange,
  purple,
}: {
  orange: React.ReactNode;
  purple: React.ReactNode;
}) {
  const { theme } = useTheme();
  return <>{theme === 'orange' ? orange : purple}</>;
}