'use client';

import React, { useEffect, useRef } from 'react';
import { X, Sliders, Palette, Type, Image, Layers, Sparkles } from 'lucide-react';
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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-4 top-20 z-50 w-[320px] rounded-xl border bg-background/95 backdrop-blur shadow-2xl",
          "animate-in slide-in-from-right-2 fade-in duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Tools & Settings</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-accent transition-colors"
            aria-label="Close tool panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[600px] overflow-y-auto p-4 space-y-6">
          {/* Generation Settings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Generation Settings</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Quality</label>
                <select className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option>Standard (Fast)</option>
                  <option>High (Balanced)</option>
                  <option>Ultra (Slow)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Style Strength</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="w-full mt-1"
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Appearance</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Theme</label>
                <select className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option>Orange (Default)</option>
                  <option>Purple (Legacy)</option>
                  <option>System</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Glass Effects</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </section>

          {/* Typography */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Typography</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Font Size</label>
                <select className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option>Small</option>
                  <option>Default</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          </section>

          {/* Image Settings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Image Settings</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Output Format</label>
                <select className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option>PNG</option>
                  <option>JPEG</option>
                  <option>WebP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Resolution</label>
                <select className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option>1024x1024</option>
                  <option>2048x2048</option>
                  <option>4096x4096</option>
                </select>
              </div>
            </div>
          </section>

          {/* Workspace */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Workspace</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Auto-save</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Show Grid</label>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Snap to Grid</label>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </section>

          {/* Advanced */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Advanced</h4>
            </div>
            <div className="space-y-3">
              <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
                Reset All Settings
              </button>
              <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
                Export Settings
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}