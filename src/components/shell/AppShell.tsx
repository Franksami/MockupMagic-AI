'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Feature flags - temporarily disabled for stability
  const isAppShellEnabled = true; // useFeatureFlag('app_shell_redesign');
  const isGlassmorphismEnabled = true; // useFeatureFlag('glassmorphism_ui');

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

  // Always render the shell for now
  // if (!isAppShellEnabled) {
  //   return <>{children}</>;
  // }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-orange-500/5" />
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(255, 140, 0, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Navigation Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <NavigationSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "relative z-20 transition-all duration-300 ease-in-out",
            isGlassmorphismEnabled && "glass-sidebar"
          )}
        />
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        className="relative flex flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Top Header Bar */}
        <motion.header
          className={cn(
            "relative z-10 flex h-16 items-center justify-between border-b px-6",
            isGlassmorphismEnabled
              ? "glass-nav border-white/10"
              : "bg-background/95 backdrop-blur border-border"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setIsCommandPaletteOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                isGlassmorphismEnabled
                  ? "glass-button hover:bg-white/10"
                  : "bg-secondary hover:bg-secondary/80"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-muted-foreground">Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setIsToolPanelOpen(!isToolPanelOpen)}
              className={cn(
                "rounded-lg p-2 transition-colors",
                isGlassmorphismEnabled
                  ? "hover:bg-white/10"
                  : "hover:bg-secondary"
              )}
              aria-label="Toggle tool panel"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main 
          className="relative flex-1 overflow-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="h-full p-6">
            {children}
          </div>
        </motion.main>

        {/* Status Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <StatusBar
            className={cn(
              "relative z-10",
              isGlassmorphismEnabled && "glass"
            )}
          />
        </motion.div>
      </motion.div>

      {/* Tool Panel */}
      <AnimatePresence>
        {isToolPanelOpen && (
          <ToolPanel
            isOpen={isToolPanelOpen}
            onClose={() => setIsToolPanelOpen(false)}
            className={cn(
              isGlassmorphismEnabled && "glass-modal"
            )}
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}