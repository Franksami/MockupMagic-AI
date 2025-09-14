'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Wand2,
  FolderOpen,
  Layout,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen
} from 'lucide-react';

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

const navigationItems = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    description: 'Overview and quick stats'
  },
  {
    label: 'Workspace',
    icon: Wand2,
    href: '/workspace',
    description: 'AI-powered editor'
  },
  {
    label: 'Generate',
    icon: Wand2,
    href: '/generate',
    description: 'Create new mockups'
  },
  {
    label: 'Projects',
    icon: FolderOpen,
    href: '/projects',
    description: 'Manage your projects'
  },
  {
    label: 'Templates',
    icon: Layout,
    href: '/templates',
    description: 'Browse templates'
  },
  {
    label: 'Community',
    icon: Users,
    href: '/community',
    description: 'Shared templates'
  },
  {
    label: 'Courses',
    icon: BookOpen,
    href: '/courses',
    description: 'Learn and grow'
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    description: 'Track performance'
  },
  {
    label: 'Billing',
    icon: CreditCard,
    href: '/billing',
    description: 'Credits and subscription'
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'App preferences'
  },
];

export function NavigationSidebar({
  isCollapsed,
  onToggleCollapse,
  className
}: NavigationSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background/95 backdrop-blur transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      {/* Logo and Workspace */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-200",
          isCollapsed && "opacity-0"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">MockupMagic</span>
        </div>

        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                isActive && "bg-accent text-accent-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={cn(
                    "font-medium",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2",
          isCollapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">U</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">User</span>
              <span className="text-xs text-muted-foreground">Pro Plan</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 z-30 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-transform hover:scale-110"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}