'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  Home,
  Wand2,
  FolderOpen,
  Layout,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  BookOpen,
  Command,
  ArrowRight,
  FileText,
  Plus,
  Upload,
  Download,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string[];
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your dashboard',
      icon: Home,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      category: 'Navigation',
      keywords: ['home', 'overview', 'stats']
    },
    {
      id: 'nav-generate',
      label: 'Generate Mockup',
      description: 'Create a new mockup',
      icon: Wand2,
      action: () => {
        router.push('/generate');
        onClose();
      },
      category: 'Navigation',
      keywords: ['create', 'new', 'ai']
    },
    {
      id: 'nav-projects',
      label: 'View Projects',
      description: 'Browse your projects',
      icon: FolderOpen,
      action: () => {
        router.push('/projects');
        onClose();
      },
      category: 'Navigation',
      keywords: ['folder', 'organize']
    },
    {
      id: 'nav-templates',
      label: 'Browse Templates',
      description: 'Explore mockup templates',
      icon: Layout,
      action: () => {
        router.push('/templates');
        onClose();
      },
      category: 'Navigation',
      keywords: ['designs', 'presets']
    },
    {
      id: 'nav-community',
      label: 'Community',
      description: 'Shared templates and resources',
      icon: Users,
      action: () => {
        router.push('/community');
        onClose();
      },
      category: 'Navigation',
      keywords: ['share', 'social']
    },
    {
      id: 'nav-courses',
      label: 'Courses',
      description: 'Learn and improve skills',
      icon: BookOpen,
      action: () => {
        router.push('/courses');
        onClose();
      },
      category: 'Navigation',
      keywords: ['learn', 'education', 'tutorial']
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      description: 'View performance metrics',
      icon: BarChart3,
      action: () => {
        router.push('/analytics');
        onClose();
      },
      category: 'Navigation',
      keywords: ['stats', 'metrics', 'data']
    },
    {
      id: 'nav-billing',
      label: 'Billing',
      description: 'Manage subscription and credits',
      icon: CreditCard,
      action: () => {
        router.push('/billing');
        onClose();
      },
      category: 'Navigation',
      keywords: ['payment', 'subscription', 'credits']
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      description: 'Configure app preferences',
      icon: Settings,
      action: () => {
        router.push('/settings');
        onClose();
      },
      category: 'Navigation',
      keywords: ['preferences', 'config']
    },

    // Actions
    {
      id: 'action-new-project',
      label: 'New Project',
      description: 'Create a new project',
      icon: Plus,
      action: () => {
        router.push('/projects/new');
        onClose();
      },
      category: 'Actions',
      keywords: ['create', 'add']
    },
    {
      id: 'action-upload',
      label: 'Upload Image',
      description: 'Upload an image for mockup',
      icon: Upload,
      action: () => {
        router.push('/generate?upload=true');
        onClose();
      },
      category: 'Actions',
      keywords: ['import', 'file']
    },
    {
      id: 'action-export',
      label: 'Export Projects',
      description: 'Download your projects',
      icon: Download,
      action: () => {
        // Trigger export logic
        onClose();
      },
      category: 'Actions',
      keywords: ['download', 'save']
    },
    {
      id: 'action-refresh',
      label: 'Refresh',
      description: 'Refresh current page',
      icon: RefreshCw,
      action: () => {
        window.location.reload();
        onClose();
      },
      category: 'Actions',
      keywords: ['reload', 'update']
    },

    // Help
    {
      id: 'help-docs',
      label: 'Documentation',
      description: 'View help documentation',
      icon: FileText,
      action: () => {
        window.open('/docs', '_blank');
        onClose();
      },
      category: 'Help',
      keywords: ['guide', 'manual', 'docs']
    },
    {
      id: 'help-support',
      label: 'Get Support',
      description: 'Contact support team',
      icon: HelpCircle,
      action: () => {
        window.open('/support', '_blank');
        onClose();
      },
      category: 'Help',
      keywords: ['help', 'contact', 'assistance']
    }
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.category.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-command-item]');
      items[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const commandIndex = -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Command Palette */}
        <motion.div 
          className="fixed inset-x-0 top-[20%] z-50 mx-auto max-w-2xl px-4"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="overflow-hidden rounded-xl glass-modal shadow-2xl">
          {/* Search Input */}
          <motion.div 
            className="flex items-center border-b border-white/10 px-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Search className="h-5 w-5 text-orange-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent px-3 py-4 text-sm text-white outline-none placeholder:text-gray-400"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 font-mono text-[10px] font-medium text-orange-300">
              ESC
            </kbd>
          </motion.div>

          {/* Command List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <motion.div 
                className="py-8 text-center text-sm text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                No results found for "{search}"
              </motion.div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands], categoryIndex) => (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + categoryIndex * 0.1 }}
                >
                  <div className="px-2 py-1.5 text-xs font-medium text-orange-300">
                    {category}
                  </div>
                  {categoryCommands.map((command, commandIndex) => {
                    commandIndex++;
                    const isSelected = commandIndex === selectedIndex;
                    const Icon = command.icon;

                    return (
                      <motion.button
                        key={command.id}
                        data-command-item
                        onClick={command.action}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all duration-200",
                          isSelected
                            ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white"
                            : "hover:bg-white/10 text-gray-300 hover:text-white"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isSelected ? "text-orange-400" : "text-gray-400"
                        )} />
                        <div className="flex flex-1 flex-col items-start">
                          <span className="font-medium">{command.label}</span>
                          {command.description && (
                            <span className="text-xs text-gray-400">
                              {command.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ArrowRight className="h-4 w-4 shrink-0 text-orange-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <motion.div 
            className="flex items-center justify-between border-t border-white/10 px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Command className="h-3 w-3" />
              <span>Command Palette</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 font-mono text-[10px] font-medium text-orange-300">
                ↑↓
              </kbd>
              <span className="text-xs text-gray-400">Navigate</span>
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 font-mono text-[10px] font-medium text-orange-300">
                ↵
              </kbd>
              <span className="text-xs text-gray-400">Select</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}