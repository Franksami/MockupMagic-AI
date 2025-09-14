'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Wand2,
  History,
  Share2,
  Download,
  Settings2,
  Sparkles,
  Grid3x3,
  Zap,
  Save,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react';
import { SmartCanvas } from './SmartCanvas';
import { BatchOperations } from './BatchOperations';
import { VersionHistory } from './VersionHistory';
import { cn } from '@/lib/utils';

interface AIWorkspaceProps {
  projectId?: string;
  className?: string;
}

export function AIWorkspace({ projectId, className }: AIWorkspaceProps) {
  const [activeView, setActiveView] = useState<'canvas' | 'batch' | 'history'>('canvas');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const workspaceTools = [
    { id: 'select', icon: Grid3x3, label: 'Select' },
    { id: 'magic', icon: Wand2, label: 'AI Magic' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'batch', icon: Zap, label: 'Batch' },
  ];

  const layers = [
    { id: 'background', name: 'Background', visible: true, locked: false },
    { id: 'product', name: 'Product Image', visible: true, locked: false },
    { id: 'effects', name: 'Effects & Shadows', visible: true, locked: false },
    { id: 'text', name: 'Text Overlay', visible: false, locked: false },
    { id: 'watermark', name: 'Watermark', visible: true, locked: true },
  ];

  return (
    <div className={cn(
      "flex h-full bg-gradient-to-br from-background via-background/95 to-background",
      className
    )}>
      {/* Left Toolbar */}
      <div className="w-16 border-r bg-card/50 backdrop-blur flex flex-col items-center py-4 gap-2">
        {workspaceTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'batch') setActiveView('batch');
                else if (tool.id === 'history') setActiveView('history');
                else setActiveView('canvas');
              }}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                activeView === tool.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-14 border-b bg-card/50 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border mx-2" />
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Project: {projectId || 'Untitled'}
            </span>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Enhance</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main View */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {activeView === 'canvas' && (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <SmartCanvas />
                </motion.div>
              )}
              {activeView === 'batch' && (
                <motion.div
                  key="batch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <BatchOperations />
                </motion.div>
              )}
              {activeView === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <VersionHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Layers Panel */}
          {showSidebar && activeView === 'canvas' && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 border-l bg-card/50 backdrop-blur"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Layers</h3>
                  <button
                    onClick={() => setShowLayers(!showLayers)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showLayers && (
                <div className="p-4 space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        selectedLayer === layer.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle visibility
                          }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          {layer.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className={cn(
                          "text-sm",
                          !layer.visible && "text-muted-foreground"
                        )}>
                          {layer.name}
                        </span>
                      </div>
                      {layer.locked && (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Properties Panel */}
              <div className="p-4 border-t">
                <h3 className="font-semibold mb-4">Properties</h3>
                {selectedLayer && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="100"
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Blend Mode</label>
                      <select className="w-full mt-1 px-3 py-2 bg-background border rounded-lg">
                        <option>Normal</option>
                        <option>Multiply</option>
                        <option>Screen</option>
                        <option>Overlay</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}