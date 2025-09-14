"use client";

import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useFrostedUI } from "@/components/providers/frosted-provider";
import type { ProductCategory } from "@/lib/prompt-engineering";

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

interface TemplateCardProps {
  template: Template;
  isSelected?: boolean;
  onSelect: () => void;
  userTier: string;
  showActions?: boolean;
}

export function TemplateCard({ 
  template, 
  isSelected = false, 
  onSelect, 
  userTier,
  showActions = true 
}: TemplateCardProps) {
  const { showNotification } = useFrostedUI();
  
  const canUseTemplate = !template.isPremium || ['pro', 'enterprise'].includes(userTier);
  const categoryColors: Record<ProductCategory, string> = {
    digital: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    physical: "bg-green-500/20 text-green-300 border-green-500/30", 
    apparel: "bg-primary-500/20 text-primary-300 border-primary-500/30",
    books: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    courses: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    branding: "bg-pink-500/20 text-pink-300 border-pink-500/30"
  };

  const handleSelect = () => {
    if (!canUseTemplate) {
      showNotification(
        `Premium template requires ${template.requiredTier} subscription or higher`, 
        "error"
      );
      return;
    }
    onSelect();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement template preview modal
    showNotification("Template preview coming soon!", "info");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-3 h-3 fill-yellow-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-3 h-3 fill-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${template._id}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-${template._id})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-3 h-3 fill-gray-600" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <FrostedCard 
      className={`group cursor-pointer transition-all duration-200 hover:scale-105 hover:border-blue-500/50 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500/50' : ''
      } ${!canUseTemplate ? 'opacity-75' : ''}`}
      onClick={handleSelect}
    >
      <div className="relative overflow-hidden">
        {/* Template Preview Image */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg overflow-hidden">
          {template.thumbnailId ? (
            <img 
              src={`/api/files/${template.thumbnailId}`}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500">No Preview</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Premium Badge */}
        {template.isPremium && (
          <div className="absolute top-2 right-2">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex space-x-2">
            <FrostedButton
              size="sm"
              variant="primary"
              onClick={handleSelect}
              disabled={!canUseTemplate}
            >
              {isSelected ? 'Selected' : 'Select'}
            </FrostedButton>
            <FrostedButton
              size="sm"
              variant="ghost"
              onClick={handlePreview}
            >
              Preview
            </FrostedButton>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-blue-300 transition-colors">
              {template.name}
            </h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[template.category]}`}>
              {template.category}
            </div>
          </div>
          
          {template.description && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Rating and Usage */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1">
              {renderStars(template.avgRating)}
            </div>
            <span className="text-gray-400 ml-1">
              {template.avgRating > 0 ? template.avgRating.toFixed(1) : 'No ratings'}
            </span>
            {template.totalRatings > 0 && (
              <span className="text-gray-500">({template.totalRatings})</span>
            )}
          </div>
          <div className="text-gray-400">
            {template.usageCount} uses
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                +{template.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="text-xs text-gray-500">
            {formatDate(template.createdAt)}
          </div>
          <div className="text-xs font-medium text-gray-400">
            {template.config.defaultSettings.style} style
          </div>
        </div>

        {/* Access Warning */}
        {!canUseTemplate && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-yellow-300">
                Requires {template.requiredTier} subscription
              </span>
            </div>
          </div>
        )}
      </div>
    </FrostedCard>
  );
}