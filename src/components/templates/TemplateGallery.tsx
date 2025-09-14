"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useWhop } from "@/components/providers/whop-provider";
import { TemplateCard } from "./TemplateCard";
import { CategoryFilter } from "./CategoryFilter";
import { TemplateSearch } from "./TemplateSearch";
import type { ProductCategory } from "@/lib/prompt-engineering";

// Template interface based on our schema
interface Template {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: ProductCategory;
  subCategory?: string;
  thumbnailId?: string;
  previewIds: string[];
  config: {
    mockupType: string;
    basePrompt: string;
    defaultSettings: {
      style: string;
      lighting?: string;
      background?: string;
      quality: string;
    };
  };
  isPublic: boolean;
  isPremium: boolean;
  requiredTier: string;
  usageCount: number;
  avgRating: number;
  totalRatings: number;
  tags: string[];
  createdAt: number;
}

interface TemplateGalleryProps {
  onTemplateSelect?: (template: Template) => void;
  selectedTemplateId?: string;
  category?: ProductCategory;
  showCreateButton?: boolean;
  maxHeight?: string;
}

export function TemplateGallery({ 
  onTemplateSelect, 
  selectedTemplateId,
  category: initialCategory,
  showCreateButton = false,
  maxHeight = "600px"
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">(
    initialCategory || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "rating">("popular");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { whopUser, convexUser } = useWhop();
  const userTier = convexUser?.subscriptionTier || "starter";
  
  const PAGE_SIZE = 12;

  // Fetch templates
  const { data: templatesData, isLoading, error, refetch } = useQuery({
    queryKey: ['templates', selectedCategory, searchQuery, showPremiumOnly, sortBy, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((currentPage - 1) * PAGE_SIZE).toString(),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
        ...(showPremiumOnly && { premium: "true" }),
        public: "true"
      });

      const response = await fetch(`/api/templates?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      // We could add a categories endpoint, for now use static data
      return [
        { category: "digital", count: 25, subCategories: ["apps", "websites", "software"] },
        { category: "physical", count: 18, subCategories: ["products", "packaging", "devices"] },
        { category: "apparel", count: 12, subCategories: ["clothing", "accessories", "footwear"] },
        { category: "books", count: 8, subCategories: ["covers", "layouts", "series"] },
        { category: "courses", count: 15, subCategories: ["online", "materials", "presentations"] },
        { category: "branding", count: 20, subCategories: ["logos", "identity", "marketing"] }
      ];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Sort templates
  const sortedTemplates = useMemo(() => {
    if (!templatesData?.data?.templates) return [];
    
    const templates = [...templatesData.data.templates];
    
    switch (sortBy) {
      case "popular":
        return templates.sort((a, b) => b.usageCount - a.usageCount);
      case "recent":
        return templates.sort((a, b) => b.createdAt - a.createdAt);
      case "rating":
        return templates.sort((a, b) => b.avgRating - a.avgRating);
      default:
        return templates;
    }
  }, [templatesData?.data?.templates, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, showPremiumOnly, sortBy]);

  const totalPages = Math.ceil((templatesData?.data?.total || 0) / PAGE_SIZE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect?.(template);
  };

  if (error) {
    return (
      <FrostedCard className="p-6 border-red-500/50">
        <div className="text-center space-y-4">
          <h3 className="text-red-300 font-semibold">Failed to Load Templates</h3>
          <p className="text-red-200 text-sm">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <FrostedButton onClick={() => refetch()} variant="primary">
            Retry Loading
          </FrostedButton>
        </div>
      </FrostedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Template Gallery</h2>
          <p className="text-gray-400 text-sm">
            Choose from {templatesData?.data?.total || 0} professional mockup templates
          </p>
        </div>
        {showCreateButton && (
          <FrostedButton variant="primary">
            Create Template
          </FrostedButton>
        )}
      </div>

      {/* Filters and Search */}
      <FrostedCard className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <TemplateSearch 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search templates..."
          />
          
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <CategoryFilter
              categories={categoriesData || []}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
            
            {/* Premium Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={(e) => setShowPremiumOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-300 text-sm">Premium Only</span>
            </label>
            
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Recently Added</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </FrostedCard>

      {/* Templates Grid */}
      <div className="relative" style={{ maxHeight }}>
        {isLoading ? (
          <FrostedCard className="p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-white">Loading templates...</span>
            </div>
          </FrostedCard>
        ) : sortedTemplates.length === 0 ? (
          <FrostedCard className="p-8">
            <div className="text-center space-y-4">
              <div className="text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-gray-300 font-medium">No Templates Found</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your filters or search terms."
                  : "No templates available at the moment."}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <FrostedButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setShowPremiumOnly(false);
                  }}
                >
                  Clear Filters
                </FrostedButton>
              )}
            </div>
          </FrostedCard>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4" style={{ maxHeight }}>
              {sortedTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  isSelected={selectedTemplateId === template._id}
                  onSelect={() => handleTemplateSelect(template)}
                  userTier={userTier}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, templatesData?.data?.total || 0)} of {templatesData?.data?.total || 0} templates
                </div>
                <div className="flex items-center space-x-2">
                  <FrostedButton
                    variant="ghost"
                    size="sm"
                    disabled={!hasPrevPage}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </FrostedButton>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <FrostedButton
                    variant="ghost"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </FrostedButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}