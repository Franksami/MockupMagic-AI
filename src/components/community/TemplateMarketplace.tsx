"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Download, Share2, Star, TrendingUp,
  Filter, Search, Grid, List, Award, Zap,
  ExternalLink, DollarSign, Users
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassContainer, LiquidGlassCard } from "@/components/ui/LiquidGlassContainer";
import { useWhop } from "@/components/providers/whop-provider";

interface TemplateMarketplaceProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'free' | 'premium' | 'featured' | 'trending';
type SortBy = 'popular' | 'recent' | 'rating' | 'downloads';

export function TemplateMarketplace({ className = "" }: TemplateMarketplaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { whopUser, isAuthenticated } = useWhop();

  // Query community templates with filters
  const communityTemplates = useQuery(api.functions.community.getCommunityTemplates, {
    filterType,
    sortBy,
    searchQuery: searchQuery.trim(),
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    limit: 50
  });

  // Query featured creators
  const featuredCreators = useQuery(api.functions.community.getFeaturedCreators, { limit: 6 });

  // Debug logging
  useEffect(() => {
    if (communityTemplates) {
      console.log('Community templates loaded:', communityTemplates.length);
    }
  }, [communityTemplates]);

  // Store categories specific to Whop marketplace
  const whopStoreCategories = [
    'all', 'digital-products', 'courses', 'communities',
    'software', 'templates', 'consulting', 'coaching',
    'memberships', 'discord-servers', 'crypto', 'fitness'
  ];

  const handleTemplateAction = async (templateId: string, action: 'like' | 'download' | 'share') => {
    if (!isAuthenticated || !whopUser) {
      // Show login prompt
      return;
    }

    try {
      // Track engagement analytics
      // Implementation will be added in community functions
      console.log(`${action} template:`, templateId);
    } catch (error) {
      console.error(`Failed to ${action} template:`, error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-4">
          Whop Creator Template Marketplace
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Discover high-converting mockup templates from successful Whop creators.
          Boost your store conversions with proven designs.
        </p>
      </div>

      {/* Stats Banner */}
      <LiquidGlassContainer className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-white">2,500+</div>
            <div className="text-sm text-gray-400">Templates Shared</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">+45%</div>
            <div className="text-sm text-gray-400">Avg Conversion Boost</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">$15K+</div>
            <div className="text-sm text-gray-400">Creator Earnings/Month</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">5,000+</div>
            <div className="text-sm text-gray-400">Active Whop Creators</div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Controls */}
      <LiquidGlassContainer className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates for your Whop store type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              {whopStoreCategories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              {(['all', 'free', 'premium', 'featured'] as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterType === filter
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="downloads">Most Downloaded</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Featured Creators Section */}
      {featuredCreators && featuredCreators.length > 0 && (
        <LiquidGlassContainer className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Featured Whop Creators</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCreators.map((creator) => (
              <motion.div
                key={creator._id}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {creator.name?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="text-sm text-white font-medium">{creator.name}</div>
                <div className="text-xs text-gray-400">{creator.totalTemplatesShared} templates</div>
                <div className="text-xs text-green-400">${creator.monthlyRevenue}/mo</div>
              </motion.div>
            ))}
          </div>
        </LiquidGlassContainer>
      )}

      {/* Templates Grid/List */}
      <div className={`grid gap-6 ${
        viewMode === 'grid'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      }`}>
        {communityTemplates?.map((template) => (
          <TemplateCard
            key={template._id}
            template={template}
            viewMode={viewMode}
            onAction={handleTemplateAction}
            userCanDownload={isAuthenticated}
          />
        ))}
      </div>

      {/* Enhanced Loading State */}
      {!communityTemplates && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-purple-300 font-medium">Loading community templates...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <LiquidGlassCard key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="aspect-video bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-2/3"></div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 bg-gray-700/50 rounded w-16"></div>
                      <div className="h-6 bg-gray-700/50 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {communityTemplates && communityTemplates.length === 0 && (
        <LiquidGlassContainer className="p-12 text-center">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Templates Found</h3>
          <p className="text-gray-400 mb-6">
            Be the first to share a template for {selectedCategory !== 'all' ? selectedCategory : 'this category'}!
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
            Share Your Template
          </button>
        </LiquidGlassContainer>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: any; // Will be properly typed once Convex functions are created
  viewMode: ViewMode;
  onAction: (templateId: string, action: 'like' | 'download' | 'share') => void;
  userCanDownload: boolean;
}

function TemplateCard({ template, viewMode, onAction, userCanDownload }: TemplateCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onAction(template._id, 'like');
  };

  const handleDownload = () => {
    onAction(template._id, 'download');
  };

  const handleShare = () => {
    onAction(template._id, 'share');
  };

  if (viewMode === 'list') {
    return (
      <LiquidGlassCard className="p-4">
        <div className="flex gap-4">
          {/* Template Preview */}
          <div className="w-32 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>

          {/* Template Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{template.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {template.rating.toFixed(1)} ({template.reviewCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {template.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{template.conversionData.improvementPercent || 0}% conversion
                  </span>
                </div>
              </div>

              {/* Price */}
              {template.price && (
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">${template.price}</div>
                  <div className="text-xs text-gray-400">one-time</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`p-2 rounded-lg transition-colors ${
                isLiked ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>

            {userCanDownload && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </LiquidGlassCard>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <LiquidGlassCard className="p-4 h-full">
        <div className="space-y-4">
          {/* Template Preview */}
          <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-12 h-12 text-purple-400" />
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {template.featured && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                  Featured
                </span>
              )}
              {template.shareType === 'premium' && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  Premium
                </span>
              )}
            </div>

            {/* Conversion Boost */}
            {template.conversionData.improvementPercent && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                +{template.conversionData.improvementPercent}%
              </div>
            )}
          </div>

          {/* Template Info */}
          <div>
            <h3 className="font-semibold text-white mb-1 line-clamp-1">{template.title}</h3>
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{template.description}</p>

            {/* Creator Info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  {template.creator?.name?.charAt(0) || 'C'}
                </span>
              </div>
              <span className="text-xs text-gray-400">{template.creator?.name}</span>
              {template.creator?.certificationStatus === 'certified' && (
                <Award className="w-3 h-3 text-yellow-400" />
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {template.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.downloads}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {template.likes}
                </span>
              </div>

              {template.price && (
                <span className="text-green-400 font-medium">
                  ${template.price}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                isLiked
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-gray-700/50 text-gray-400 hover:text-red-400 border border-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 mx-auto ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>

            {userCanDownload && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4 mx-auto" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex-1 py-2 px-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white rounded-lg text-sm transition-colors border border-gray-600"
            >
              <Share2 className="w-4 h-4 mx-auto" />
            </motion.button>
          </div>

          {/* Store Integration Button */}
          <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Apply to My Whop Store
          </button>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}