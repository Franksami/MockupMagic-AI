'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  GitBranch,
  GitCommit,
  GitMerge,
  Download,
  Eye,
  RotateCcw,
  Star,
  User,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Version {
  id: string;
  version: string;
  timestamp: Date;
  author: string;
  changes: string[];
  thumbnail?: string;
  isSaved: boolean;
  isAutosave: boolean;
}

export function VersionHistory() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>('v5');
  const [showComparison, setShowComparison] = useState(false);
  const [compareWith, setCompareWith] = useState<string | null>(null);

  const versions: Version[] = [
    {
      id: 'v5',
      version: '2.5.0',
      timestamp: new Date('2024-01-14T15:30:00'),
      author: 'You',
      changes: [
        'Added product shadow',
        'Adjusted background gradient',
        'Enhanced color saturation'
      ],
      isSaved: true,
      isAutosave: false
    },
    {
      id: 'v4',
      version: '2.4.0',
      timestamp: new Date('2024-01-14T14:45:00'),
      author: 'You',
      changes: [
        'Applied AI enhancement',
        'Fixed alignment issues'
      ],
      isSaved: false,
      isAutosave: true
    },
    {
      id: 'v3',
      version: '2.3.0',
      timestamp: new Date('2024-01-14T13:20:00'),
      author: 'AI Assistant',
      changes: [
        'Auto-optimized lighting',
        'Removed background artifacts',
        'Improved contrast'
      ],
      isSaved: true,
      isAutosave: false
    },
    {
      id: 'v2',
      version: '2.2.0',
      timestamp: new Date('2024-01-14T11:00:00'),
      author: 'You',
      changes: [
        'Changed template style',
        'Updated text overlay'
      ],
      isSaved: false,
      isAutosave: true
    },
    {
      id: 'v1',
      version: '2.1.0',
      timestamp: new Date('2024-01-14T10:00:00'),
      author: 'You',
      changes: [
        'Initial mockup creation',
        'Uploaded product image'
      ],
      isSaved: true,
      isAutosave: false
    }
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex">
      {/* Timeline Panel */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-2">Version History</h3>
          <p className="text-sm text-muted-foreground">
            Track and restore previous versions
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Version Items */}
            <div className="space-y-6">
              {versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative flex gap-4 cursor-pointer",
                    selectedVersion === version.id && "opacity-100",
                    selectedVersion !== version.id && "opacity-70 hover:opacity-100"
                  )}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  {/* Timeline Node */}
                  <div className="relative z-10">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center",
                      selectedVersion === version.id
                        ? "border-primary"
                        : "border-muted-foreground"
                    )}>
                      {version.isSaved ? (
                        <GitCommit className="w-4 h-4" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>
                  </div>

                  {/* Version Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Version {version.version}
                          </span>
                          {version.isSaved && (
                            <Star className="w-3 h-3 text-yellow-500" />
                          )}
                          {version.isAutosave && (
                            <span className="text-xs text-muted-foreground">
                              (Autosave)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(version.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Changes */}
                    <div className="space-y-1">
                      {version.changes.map((change, i) => (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t space-y-3">
          <button className="w-full flex items-center justify-center gap-2 p-2 border rounded-lg hover:bg-accent transition-colors">
            <GitBranch className="w-4 h-4" />
            <span className="text-sm">Create Branch</span>
          </button>
          <button className="w-full flex items-center justify-center gap-2 p-2 border rounded-lg hover:bg-accent transition-colors">
            <GitMerge className="w-4 h-4" />
            <span className="text-sm">Compare Versions</span>
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedVersion && versions.find(v => v.id === selectedVersion)?.version}
              </h3>
              <p className="text-sm text-muted-foreground">
                Preview and restore this version
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Restore</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6">
          <div className="h-full bg-card rounded-lg border flex items-center justify-center">
            {showComparison ? (
              <div className="grid grid-cols-2 gap-4 p-8 w-full h-full">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-muted rounded-lg w-full h-64 mb-2" />
                  <span className="text-sm text-muted-foreground">Current</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-muted rounded-lg w-full h-64 mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Version {selectedVersion}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-muted rounded-lg w-96 h-64 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Preview of Version {selectedVersion}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Toggle */}
        <div className="p-6 border-t">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="text-primary"
            />
            <span className="text-sm">Show side-by-side comparison</span>
          </label>
        </div>
      </div>
    </div>
  );
}