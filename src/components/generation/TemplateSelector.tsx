'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  thumbnail: string;
  isPremium: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  isNew?: boolean;
  isTrending?: boolean;
}

interface TemplateSelectorProps {
  templates?: Template[];
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
  className?: string;
}

// Generate mock templates for demonstration
const generateMockTemplates = (count: number): Template[] => {
  const categories = ['T-Shirt', 'Phone Case', 'Laptop', 'Poster', 'Book Cover', 'Business Card', 'Social Media', 'Logo'];
  const styles = ['Minimal', 'Modern', 'Classic', 'Bold', 'Vintage', 'Futuristic', 'Artistic', 'Professional'];

  return Array.from({ length: count }, (_, i) => ({
    id: `template-${i}`,
    name: `${styles[i % styles.length]} ${categories[i % categories.length]} Template`,
    category: categories[i % categories.length],
    subCategory: styles[i % styles.length],
    thumbnail: `https://picsum.photos/seed/${i}/400/300`,
    isPremium: Math.random() > 0.7,
    usageCount: Math.floor(Math.random() * 10000),
    rating: 3.5 + Math.random() * 1.5,
    tags: [categories[i % categories.length].toLowerCase(), styles[i % styles.length].toLowerCase()],
    isNew: Math.random() > 0.9,
    isTrending: Math.random() > 0.85,
  }));
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates = generateMockTemplates(1000),
  onSelectTemplate,
  selectedTemplateId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats);
  }, [templates]);

  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: Math.ceil(filteredTemplates.length / 3), // 3 columns per row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Estimated height of each row
    overscan: 2,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className={cn('w-full h-full flex flex-col', className)} data-testid="template-selector">
      {/* Search and Filters */}
      <LiquidGlassContainer
        variant="shallow"
        className="mb-6 p-4 sticky top-0 z-10"
        shimmer
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              data-testid="template-search"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 rounded-lg whitespace-nowrap transition-all',
                !selectedCategory
                  ? 'bg-gradient-to-r from-indigo-500 to-primary-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              )}
              data-testid="category-filter"
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-lg whitespace-nowrap transition-all',
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-500 to-primary-500 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                )}
                data-testid="category-filter"
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2" data-testid="sort-dropdown">
            <button
              onClick={() => setSortBy('popular')}
              className={cn(
                'p-2 rounded-lg transition-all',
                sortBy === 'popular' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'
              )}
              title="Most Popular"
              data-testid="sort-popular"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={cn(
                'p-2 rounded-lg transition-all',
                sortBy === 'rating' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'
              )}
              title="Highest Rated"
              data-testid="sort-rating"
            >
              <Star className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={cn(
                'p-2 rounded-lg transition-all',
                sortBy === 'newest' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'
              )}
              title="Newest"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-400">
          {filteredTemplates.length} templates found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </div>
      </LiquidGlassContainer>

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto pr-2"
        style={{ scrollbarGutter: 'stable' }}
        data-testid="template-grid"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const startIndex = virtualRow.index * 3;
            const endIndex = Math.min(startIndex + 3, filteredTemplates.length);
            const rowTemplates = filteredTemplates.slice(startIndex, endIndex);

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                  {rowTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                      }}
                    >
                      <LiquidGlassCard
                        variant="shallow"
                        interactive
                        glow={selectedTemplateId === template.id}
                        className={cn(
                          'cursor-pointer transition-all duration-300 overflow-hidden group',
                          selectedTemplateId === template.id && 'ring-2 ring-primary-500'
                        )}
                        onClick={() => onSelectTemplate(template)}
                        data-testid="template-item"
                        data-template-id={template.id}
                        data-category={template.category}
                        data-uses={template.usageCount}
                        data-rating={template.rating}
                        aria-selected={selectedTemplateId === template.id}
                      >
                        {/* Template Image */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            data-testid="template-thumbnail"
                          />

                          {/* Overlay Badges */}
                          <div className="absolute top-2 left-2 right-2 flex justify-between">
                            <div className="flex gap-2">
                              {template.isPremium && (
                                <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                  PRO
                                </span>
                              )}
                              {template.isNew && (
                                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                  NEW
                                </span>
                              )}
                              {template.isTrending && (
                                <span className="px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  HOT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <div className="text-white">
                              <p className="text-sm opacity-90">{template.category}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{template.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-xs opacity-75">
                                  {template.usageCount.toLocaleString()} uses
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Template Info */}
                        <div className="p-4">
                          <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                            {template.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </LiquidGlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16" data-testid="empty-state">
          <Sparkles className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No templates found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}

      {/* Loading More Indicator */}
      <div data-testid="load-more-trigger" style={{ display: 'none' }}></div>
      <div data-testid="loading-more" style={{ display: 'none' }}></div>
    </div>
  );
};