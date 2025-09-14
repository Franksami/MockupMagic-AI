'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  List,
  Download,
  Share2,
  Heart,
  Eye,
  Trash2,
  Edit,
  MoreVertical,
  Filter,
  SortAsc,
  Loader2,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn, formatRelativeTime } from '@/lib/utils';

interface Mockup {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  createdAt: Date;
  downloads: number;
  likes: number;
  views: number;
  status: 'generating' | 'ready' | 'failed';
  progress?: number;
  tags: string[];
  isPublic: boolean;
  isPremium?: boolean;
  rating?: number;
  generationTime?: number;
}

interface VirtualizedGalleryProps {
  mockups: Mockup[];
  onMockupClick?: (mockup: Mockup) => void;
  onMockupDelete?: (mockupId: string) => void;
  onMockupDownload?: (mockup: Mockup) => void;
  onMockupShare?: (mockup: Mockup) => void;
  onMockupLike?: (mockup: Mockup) => void;
  className?: string;
}

export const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  mockups,
  onMockupClick,
  onMockupDelete,
  onMockupDownload,
  onMockupShare,
  onMockupLike,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'downloads'>('newest');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [selectedMockups, setSelectedMockups] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Get unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockups.forEach(mockup => mockup.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [mockups]);

  // Filter and sort mockups
  const processedMockups = useMemo(() => {
    let filtered = mockups;

    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(m => m.tags.includes(filterTag));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.likes + b.views) - (a.likes + a.views);
        case 'downloads':
          return b.downloads - a.downloads;
        case 'newest':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return sorted;
  }, [mockups, filterTag, sortBy]);

  // Virtual scrolling configuration
  const columns = viewMode === 'grid' ? 3 : 1;
  const rowCount = Math.ceil(processedMockups.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === 'grid' ? 320 : 120,
    overscan: 2,
  });

  const items = virtualizer.getVirtualItems();

  const toggleSelection = useCallback((mockupId: string) => {
    setSelectedMockups(prev => {
      const next = new Set(prev);
      if (next.has(mockupId)) {
        next.delete(mockupId);
      } else {
        next.add(mockupId);
      }
      return next;
    });
  }, []);

  const handleBulkAction = (action: 'download' | 'delete' | 'share') => {
    const selected = Array.from(selectedMockups);
    selected.forEach(id => {
      const mockup = mockups.find(m => m.id === id);
      if (mockup) {
        switch (action) {
          case 'download':
            onMockupDownload?.(mockup);
            break;
          case 'delete':
            onMockupDelete?.(id);
            break;
          case 'share':
            onMockupShare?.(mockup);
            break;
        }
      }
    });
    setSelectedMockups(new Set());
  };

  const renderMockupCard = (mockup: Mockup) => {
    const isSelected = selectedMockups.has(mockup.id);
    const isHovered = hoveredId === mockup.id;

    if (viewMode === 'list') {
      return (
        <motion.div
          key={mockup.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onMouseEnter={() => setHoveredId(mockup.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <LiquidGlassCard
            variant="shallow"
            interactive
            glow={isSelected}
            className={cn(
              'p-4 cursor-pointer transition-all',
              isSelected && 'ring-2 ring-primary-500'
            )}
            onClick={() => onMockupClick?.(mockup)}
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelection(mockup.id);
                }}
                className="w-4 h-4 text-primary-500 rounded"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                {mockup.status === 'generating' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                  </div>
                ) : (
                  <img
                    src={mockup.thumbnailUrl}
                    alt={mockup.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-white font-medium">{mockup.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                  <span>{formatRelativeTime(mockup.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {mockup.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {mockup.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {mockup.downloads}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {mockup.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {mockup.status === 'generating' ? (
                  <div className="text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-400 mb-1" />
                    <span className="text-xs text-gray-400">{mockup.progress}%</span>
                  </div>
                ) : mockup.status === 'ready' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <span className="text-red-400 text-xs">Failed</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMockupDownload?.(mockup);
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMockupShare?.(mockup);
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMockupDelete?.(mockup.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      );
    }

    // Grid view card
    return (
      <motion.div
        key={mockup.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        onMouseEnter={() => setHoveredId(mockup.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <LiquidGlassCard
          variant="shallow"
          interactive
          glow={isSelected}
          className={cn(
            'cursor-pointer transition-all overflow-hidden group',
            isSelected && 'ring-2 ring-primary-500'
          )}
          onClick={() => onMockupClick?.(mockup)}
        >
          {/* Image Container */}
          <div className="relative aspect-square">
            {mockup.status === 'generating' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-12 h-12 text-primary-400 mb-3" />
                </motion.div>
                <p className="text-white text-sm mb-2">Generating...</p>
                <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-pink-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${mockup.progress || 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : (
              <>
                <img
                  src={mockup.thumbnailUrl}
                  alt={mockup.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(mockup.id);
                      }}
                      className="w-4 h-4 text-primary-500 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {mockup.isPremium && (
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                        PRO
                      </span>
                    )}
                    {mockup.isPublic && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        PUBLIC
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMockupLike?.(mockup);
                        }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMockupShare?.(mockup);
                        }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMockupDownload?.(mockup);
                      }}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Status Badge */}
            {mockup.status === 'ready' && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="p-4">
            <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors line-clamp-1">
              {mockup.title}
            </h3>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{formatRelativeTime(mockup.createdAt)}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {mockup.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {mockup.likes}
                </span>
              </div>
            </div>
            {mockup.rating && (
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3 h-3',
                      i < Math.floor(mockup.rating!)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    )}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {mockup.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </LiquidGlassCard>
      </motion.div>
    );
  };

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* Toolbar */}
      <LiquidGlassContainer variant="shallow" className="p-4 mb-4">
        <div className="flex items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter by Tag */}
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedMockups.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {selectedMockups.size} selected
              </span>
              <LiquidGlassButton
                onClick={() => handleBulkAction('download')}
                className="px-3 py-1 text-sm"
              >
                Download All
              </LiquidGlassButton>
              <LiquidGlassButton
                onClick={() => handleBulkAction('share')}
                className="px-3 py-1 text-sm"
              >
                Share All
              </LiquidGlassButton>
              <LiquidGlassButton
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30"
              >
                Delete All
              </LiquidGlassButton>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-400">
            {processedMockups.length} mockups
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto pr-2"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const endIndex = Math.min(startIndex + columns, processedMockups.length);
            const rowMockups = processedMockups.slice(startIndex, endIndex);

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-2'
                )}>
                  {rowMockups.map((mockup) => renderMockupCard(mockup))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};