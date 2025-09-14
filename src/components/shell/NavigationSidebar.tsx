'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

const navigationItems = [
  {
    label: 'Home',
    icon: Home,
    href: '/',
    description: 'Landing page',
    color: 'text-blue-400'
  },
  {
    label: 'Studio',
    icon: Wand2,
    href: '/studio',
    description: 'Create mockups',
    color: 'text-orange-400'
  },
  {
    label: 'Dashboard',
    icon: Sparkles,
    href: '/dashboard',
    description: 'View analytics',
    color: 'text-purple-400'
  },
];

export function NavigationSidebar({
  isCollapsed,
  onToggleCollapse,
  className
}: NavigationSidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      className={cn(
        "relative flex flex-col border-r bg-background/95 backdrop-blur transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo and Workspace */}
      <motion.div 
        className="flex h-16 items-center justify-between border-b px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div 
          className={cn(
            "flex items-center gap-3 transition-opacity duration-200",
            isCollapsed && "opacity-0"
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Wand2 className="h-5 w-5" />
          </motion.div>
          <span className="font-semibold text-lg text-white">MockupMagic</span>
        </motion.div>

        {isCollapsed && (
          <motion.div 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Wand2 className="h-5 w-5" />
          </motion.div>
        )}
      </motion.div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/10",
                  isActive && "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? item.color : "text-gray-400 group-hover:text-white"
                  )} />
                </motion.div>
                {!isCollapsed && (
                  <motion.div 
                    className="flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <span className={cn(
                      "font-medium transition-colors",
                      isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                    )}>
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      {item.description}
                    </span>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <motion.div 
        className="border-t p-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 group hover:bg-white/5 transition-colors",
          isCollapsed && "justify-center"
        )}>
          <motion.div 
            className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform"
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-xs font-medium text-orange-300">U</span>
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              className="flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <span className="text-sm font-medium text-white">User</span>
              <span className="text-xs text-gray-400">Pro Plan</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Collapse Toggle Button */}
      <motion.button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 z-30 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-transform hover:scale-110"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </motion.button>
    </motion.aside>
  );
}