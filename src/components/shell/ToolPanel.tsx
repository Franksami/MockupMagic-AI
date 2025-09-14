'use client';

import React, { useEffect, useRef } from 'react';
import { X, Sliders, Palette, Type, Image, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ToolPanel({ isOpen, onClose, className }: ToolPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Panel */}
        <motion.div
          ref={panelRef}
          className={cn(
            "fixed right-4 top-20 z-50 w-[320px] rounded-xl glass-modal shadow-2xl",
            className
          )}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between border-b border-white/10 px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="font-semibold text-white">Tools & Settings</h3>
          <motion.button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10 transition-colors"
            aria-label="Close tool panel"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4 text-gray-400" />
          </motion.button>
        </motion.div>

        {/* Content */}
        <motion.div 
          className="max-h-[600px] overflow-y-auto p-4 space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Generation Settings */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Generation Settings</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Quality</label>
                <select className="w-full mt-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white">
                  <option>Standard (Fast)</option>
                  <option>High (Balanced)</option>
                  <option>Ultra (Slow)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Style Strength</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="w-full mt-1 accent-orange-500"
                />
              </div>
            </div>
          </motion.section>

          {/* Appearance */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Appearance</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Theme</label>
                <select className="w-full mt-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white">
                  <option>Orange (Default)</option>
                  <option>Purple (Legacy)</option>
                  <option>System</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Glass Effects</label>
                <input type="checkbox" defaultChecked className="rounded accent-orange-500" />
              </div>
            </div>
          </motion.section>

          {/* Typography */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Typography</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Font Size</label>
                <select className="w-full mt-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white">
                  <option>Small</option>
                  <option>Default</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Image Settings */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Image Settings</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Output Format</label>
                <select className="w-full mt-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white">
                  <option>PNG</option>
                  <option>JPEG</option>
                  <option>WebP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Resolution</label>
                <select className="w-full mt-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white">
                  <option>1024x1024</option>
                  <option>2048x2048</option>
                  <option>4096x4096</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Workspace */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Workspace</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Auto-save</label>
                <input type="checkbox" defaultChecked className="rounded accent-orange-500" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Show Grid</label>
                <input type="checkbox" className="rounded accent-orange-500" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Snap to Grid</label>
                <input type="checkbox" className="rounded accent-orange-500" />
              </div>
            </div>
          </motion.section>

          {/* Advanced */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="h-4 w-4 text-orange-400" />
              <h4 className="font-medium text-sm text-white">Advanced</h4>
            </div>
            <div className="space-y-3">
              <motion.button 
                className="w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Reset All Settings
              </motion.button>
              <motion.button 
                className="w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Export Settings
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}