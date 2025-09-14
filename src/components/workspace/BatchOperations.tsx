'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  completedItems: number;
  estimatedTime?: string;
}

export function BatchOperations() {
  const [jobs, setJobs] = useState<BatchJob[]>([
    {
      id: '1',
      name: 'Product Catalog Mockups',
      status: 'completed',
      progress: 100,
      totalItems: 25,
      completedItems: 25,
    },
    {
      id: '2',
      name: 'Social Media Templates',
      status: 'processing',
      progress: 65,
      totalItems: 10,
      completedItems: 6,
      estimatedTime: '2 min'
    },
    {
      id: '3',
      name: 'Email Headers',
      status: 'pending',
      progress: 0,
      totalItems: 15,
      completedItems: 0,
      estimatedTime: '5 min'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [outputFormat, setOutputFormat] = useState('png');
  const [quality, setQuality] = useState('high');

  const templates = [
    { id: 'default', name: 'Default Template' },
    { id: 'minimal', name: 'Minimal Style' },
    { id: 'bold', name: 'Bold & Vibrant' },
    { id: 'elegant', name: 'Elegant Professional' },
    { id: 'creative', name: 'Creative Modern' }
  ];

  const getStatusIcon = (status: BatchJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: BatchJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-primary';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Job Queue */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-2">Batch Processing Queue</h3>
          <p className="text-sm text-muted-foreground">
            Process multiple mockups simultaneously with AI optimization
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h4 className="font-medium">{job.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.completedItems} of {job.totalItems} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'processing' && (
                    <button className="p-1 hover:bg-accent rounded">
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {job.status === 'pending' && (
                    <button className="p-1 hover:bg-accent rounded">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button className="p-1 hover:bg-accent rounded">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <button className="p-1 hover:bg-accent rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      job.status === 'completed' ? "bg-green-500" :
                      job.status === 'processing' ? "bg-primary" :
                      job.status === 'failed' ? "bg-red-500" :
                      "bg-muted-foreground"
                    )}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={getStatusColor(job.status)}>
                  {job.status === 'processing' ? 'Processing...' :
                   job.status === 'completed' ? 'Completed' :
                   job.status === 'failed' ? 'Failed' :
                   'Pending'}
                </span>
                {job.estimatedTime && job.status === 'processing' && (
                  <span className="text-muted-foreground">
                    Est. {job.estimatedTime} remaining
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add New Batch Button */}
        <div className="p-6 border-t">
          <button className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="font-medium">Add New Batch</span>
          </button>
        </div>
      </div>

      {/* Right Panel - Settings */}
      <div className="w-1/2 flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-2">Batch Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure processing options for your batch operations
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Template Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "p-3 rounded-lg border text-sm transition-all",
                    selectedTemplate === template.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent"
                  )}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full px-3 py-2 bg-background border rounded-lg"
            >
              <option value="png">PNG (Transparent)</option>
              <option value="jpg">JPEG (Compressed)</option>
              <option value="webp">WebP (Modern)</option>
              <option value="svg">SVG (Vector)</option>
            </select>
          </div>

          {/* Quality Settings */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Quality Preset
            </label>
            <div className="space-y-2">
              {['draft', 'standard', 'high', 'ultra'].map((q) => (
                <label
                  key={q}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="quality"
                    value={q}
                    checked={quality === q}
                    onChange={(e) => setQuality(e.target.value)}
                    className="text-primary"
                  />
                  <span className="capitalize">{q}</span>
                  <span className="text-xs text-muted-foreground">
                    {q === 'draft' && '(Fast, ~1 credit)'}
                    {q === 'standard' && '(Balanced, ~2 credits)'}
                    {q === 'high' && '(Detailed, ~3 credits)'}
                    {q === 'ultra' && '(Maximum, ~5 credits)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Enhancement Options */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              AI Enhancements
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary" />
                <span className="text-sm">Auto color correction</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary" />
                <span className="text-sm">Smart object removal</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="text-primary" />
                <span className="text-sm">Background optimization</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="text-primary" />
                <span className="text-sm">Shadow generation</span>
              </label>
            </div>
          </div>

          {/* Processing Options */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Processing Options
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Parallel Processing (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="5"
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Max Retries on Failure
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  defaultValue="3"
                  className="w-full px-3 py-2 bg-background border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t flex gap-3">
          <button className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
            Save Preset
          </button>
          <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Start Processing
          </button>
        </div>
      </div>
    </div>
  );
}