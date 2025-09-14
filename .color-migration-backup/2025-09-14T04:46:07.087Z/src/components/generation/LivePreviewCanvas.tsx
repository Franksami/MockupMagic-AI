'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Grid,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface LivePreviewCanvasProps {
  imageUrl?: string;
  mockupUrl?: string;
  isGenerating?: boolean;
  progress?: number;
  onRegenerate?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  imageUrl,
  mockupUrl,
  isGenerating = false,
  progress = 0,
  onRegenerate,
  onDownload,
  className,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'split' | 'overlay'>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const renderPreviewContent = () => {
    if (isGenerating) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="w-24 h-24 mx-auto mb-4"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Sparkles className="w-full h-full text-purple-400" />
            </motion.div>
            <p className="text-white text-lg font-medium mb-2">Generating Mockup...</p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">{progress}% Complete</p>
          </div>
        </div>
      );
    }

    if (!imageUrl && !mockupUrl) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Grid className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No preview available</p>
            <p className="text-gray-500 text-sm mt-2">Upload an image to get started</p>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'split':
        return (
          <div className="absolute inset-0 flex">
            <div className="w-1/2 p-4">
              <div className="h-full relative">
                <img
                  src={imageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s',
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                  Original
                </div>
              </div>
            </div>
            <div className="w-0.5 bg-gray-600" />
            <div className="w-1/2 p-4">
              <div className="h-full relative">
                {mockupUrl ? (
                  <>
                    <img
                      src={mockupUrl}
                      alt="Mockup"
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transition: 'transform 0.3s',
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500/50 backdrop-blur-sm rounded text-white text-xs">
                      Generated
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Mockup will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'overlay':
        return (
          <div className="absolute inset-0 p-4">
            <div className="relative h-full">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain opacity-50"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s',
                  }}
                />
              )}
              {mockupUrl && (
                <img
                  src={mockupUrl}
                  alt="Mockup"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s',
                  }}
                />
              )}
            </div>
          </div>
        );

      default: // single
        return (
          <div className="absolute inset-0 p-4">
            <img
              src={mockupUrl || imageUrl}
              alt="Preview"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s',
              }}
            />
          </div>
        );
    }
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative w-full h-full min-h-[400px]',
        isFullscreen && 'fixed inset-0 z-50 bg-gray-900',
        className
      )}
    >
      <LiquidGlassContainer
        variant="medium"
        className="h-full flex flex-col"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {/* View Mode Toggles */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('single')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'single'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title="Single View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'split'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title="Split View"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'overlay'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                title="Overlay View"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm text-gray-300 min-w-[50px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Regenerate */}
            {mockupUrl && onRegenerate && (
              <LiquidGlassButton
                onClick={onRegenerate}
                className="px-3 py-1.5 text-sm"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </LiquidGlassButton>
            )}

            {/* Download */}
            {mockupUrl && onDownload && (
              <LiquidGlassButton
                onClick={onDownload}
                className="px-3 py-1.5 text-sm"
                disabled={isGenerating}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </LiquidGlassButton>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-900/50">
          <AnimatePresence mode="wait">
            {renderPreviewContent()}
          </AnimatePresence>

          {/* Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Zoom: {zoom}%</span>
            <span>Rotation: {rotation}°</span>
            <span>Mode: {viewMode}</span>
          </div>
          {mockupUrl && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Mockup Ready</span>
            </div>
          )}
        </div>
      </LiquidGlassContainer>
    </div>
  );
};