'use client';

import React, { useState, useEffect } from 'react';
import { NavigationSidebar } from './NavigationSidebar';
import { ToolPanel } from './ToolPanel';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { useFeatureFlag } from '@/lib/featureFlags';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Feature flags
  const isAppShellEnabled = useFeatureFlag('app_shell_redesign');
  const isGlassmorphismEnabled = useFeatureFlag('glassmorphism_ui');

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If app shell is not enabled, just render children
  if (!isAppShellEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={cn(
          "relative z-20 transition-all duration-300 ease-in-out",
          isGlassmorphismEnabled && "glass-sidebar"
        )}
      />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header
          className={cn(
            "relative z-10 flex h-16 items-center justify-between border-b px-6",
            isGlassmorphismEnabled
              ? "glass-nav border-white/10"
              : "bg-background/95 backdrop-blur border-border"
          )}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                isGlassmorphismEnabled
                  ? "glass-button hover:bg-white/10"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              <span className="text-muted-foreground">Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsToolPanelOpen(!isToolPanelOpen)}
              className={cn(
                "rounded-lg p-2 transition-colors",
                isGlassmorphismEnabled
                  ? "hover:bg-white/10"
                  : "hover:bg-secondary"
              )}
              aria-label="Toggle tool panel"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>

        {/* Status Bar */}
        <StatusBar
          className={cn(
            "relative z-10",
            isGlassmorphismEnabled && "glass"
          )}
        />
      </div>

      {/* Tool Panel */}
      <ToolPanel
        isOpen={isToolPanelOpen}
        onClose={() => setIsToolPanelOpen(false)}
        className={cn(
          isGlassmorphismEnabled && "glass-modal"
        )}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}