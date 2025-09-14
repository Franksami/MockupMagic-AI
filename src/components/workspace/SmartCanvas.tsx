'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Crosshair,
  Move,
  MousePointer,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SmartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<'select' | 'move' | 'crosshair'>('select');
  const [showGrid, setShowGrid] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawCanvas(ctx, canvas);
    };

    const drawCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid if enabled
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 20 * (zoom / 100);

        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw placeholder content
      ctx.fillStyle = '#FA4616';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI Smart Canvas', canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = 'rgba(250, 70, 22, 0.5)';
      ctx.font = '16px sans-serif';
      ctx.fillText('Drop your design here or use AI generation', canvas.width / 2, canvas.height / 2 + 30);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simulate AI suggestions
    const suggestions = [
      'Add subtle shadow for depth',
      'Increase contrast for better visibility',
      'Apply golden ratio for composition',
      'Use complementary colors for accent',
      'Add motion blur for dynamism'
    ];

    setTimeout(() => {
      setAiSuggestions(suggestions.slice(0, 3));
    }, 1000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [zoom, showGrid]);

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'in') {
      setZoom(prev => Math.min(prev + 10, 200));
    } else if (direction === 'out') {
      setZoom(prev => Math.max(prev - 10, 50));
    } else {
      setZoom(100);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-background/50">
      {/* Canvas Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card/90 backdrop-blur border rounded-lg p-2">
        <button
          onClick={() => setTool('select')}
          className={cn(
            "p-2 rounded transition-colors",
            tool === 'select' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
          title="Select Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('move')}
          className={cn(
            "p-2 rounded transition-colors",
            tool === 'move' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
          title="Move Tool"
        >
          <Move className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('crosshair')}
          className={cn(
            "p-2 rounded transition-colors",
            tool === 'crosshair' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
          title="Crosshair Tool"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            "p-2 rounded transition-colors",
            showGrid ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-card/90 backdrop-blur border rounded-lg p-2">
        <button
          onClick={() => handleZoom('out')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-2 text-sm font-medium min-w-[60px] text-center">
          {zoom}%
        </span>
        <button
          onClick={() => handleZoom('in')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => handleZoom('fit')}
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Fit to Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-10 w-64 bg-card/90 backdrop-blur border rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">AI Suggestions</h4>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-full text-left p-2 text-xs hover:bg-accent rounded-lg transition-colors"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-grid-white/[0.02]"
        style={{
          cursor: tool === 'move' ? 'move' : tool === 'crosshair' ? 'crosshair' : 'default'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center'
          }}
        />
      </div>
    </div>
  );
}