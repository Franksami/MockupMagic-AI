"use client";

import { Fragment } from "react";
import type { ProductCategory } from "@/lib/prompt-engineering";

interface CategoryData {
  category: string;
  count: number;
  subCategories: string[];
}

interface CategoryFilterProps {
  categories: CategoryData[];
  selected: ProductCategory | "all";
  onSelect: (category: ProductCategory | "all") => void;
  showCounts?: boolean;
}

export function CategoryFilter({ 
  categories, 
  selected, 
  onSelect, 
  showCounts = true 
}: CategoryFilterProps) {
  
  const categoryConfig: Record<ProductCategory | "all", { 
    label: string; 
    icon: string;
    color: string;
  }> = {
    all: {
      label: "All Templates",
      icon: "🎨",
      color: "text-gray-300 hover:text-white"
    },
    digital: {
      label: "Digital Products", 
      icon: "💻",
      color: "text-blue-300 hover:text-blue-200"
    },
    physical: {
      label: "Physical Products",
      icon: "📦", 
      color: "text-green-300 hover:text-green-200"
    },
    apparel: {
      label: "Clothing & Apparel",
      icon: "👕",
      color: "text-purple-300 hover:text-purple-200"
    },
    books: {
      label: "Books & Publications", 
      icon: "📚",
      color: "text-orange-300 hover:text-orange-200"
    },
    courses: {
      label: "Online Courses",
      icon: "🎓", 
      color: "text-yellow-300 hover:text-yellow-200"
    },
    branding: {
      label: "Brand Identity",
      icon: "🏷️",
      color: "text-pink-300 hover:text-pink-200"
    }
  };

  const getTotalCount = () => {
    return categories.reduce((sum, cat) => sum + cat.count, 0);
  };

  const getCategoryCount = (categoryKey: string) => {
    const categoryData = categories.find(cat => cat.category === categoryKey);
    return categoryData?.count || 0;
  };

  const allCategories: Array<ProductCategory | "all"> = [
    "all",
    ...categories.map(cat => cat.category as ProductCategory)
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((categoryKey) => {
        const config = categoryConfig[categoryKey];
        const isSelected = selected === categoryKey;
        const count = categoryKey === "all" ? getTotalCount() : getCategoryCount(categoryKey);
        
        if (categoryKey !== "all" && count === 0) {
          return null; // Don't show categories with no templates
        }
        
        return (
          <button
            key={categoryKey}
            onClick={() => onSelect(categoryKey)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200
              ${isSelected 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg' 
                : 'bg-gray-700/30 border-gray-600 hover:bg-gray-600/30 hover:border-gray-500'
              }
              ${config.color}
            `}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="text-sm font-medium">
              {config.label}
            </span>
            {showCounts && count > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full 
                ${isSelected 
                  ? 'bg-blue-400/20 text-blue-200' 
                  : 'bg-gray-600/50 text-gray-400'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Alternative compact version for mobile or sidebar use
export function CategoryFilterCompact({ 
  categories, 
  selected, 
  onSelect 
}: CategoryFilterProps) {
  const categoryConfig: Record<ProductCategory | "all", { 
    label: string; 
    shortLabel: string;
    icon: string;
  }> = {
    all: { label: "All Templates", shortLabel: "All", icon: "🎨" },
    digital: { label: "Digital Products", shortLabel: "Digital", icon: "💻" },
    physical: { label: "Physical Products", shortLabel: "Physical", icon: "📦" },
    apparel: { label: "Clothing & Apparel", shortLabel: "Apparel", icon: "👕" },
    books: { label: "Books & Publications", shortLabel: "Books", icon: "📚" },
    courses: { label: "Online Courses", shortLabel: "Courses", icon: "🎓" },
    branding: { label: "Brand Identity", shortLabel: "Branding", icon: "🏷️" }
  };

  const getTotalCount = () => {
    return categories.reduce((sum, cat) => sum + cat.count, 0);
  };

  const getCategoryCount = (categoryKey: string) => {
    const categoryData = categories.find(cat => cat.category === categoryKey);
    return categoryData?.count || 0;
  };

  const allCategories: Array<ProductCategory | "all"> = [
    "all",
    ...categories.map(cat => cat.category as ProductCategory)
  ];

  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value as ProductCategory | "all")}
      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
    >
      {allCategories.map((categoryKey) => {
        const config = categoryConfig[categoryKey];
        const count = categoryKey === "all" ? getTotalCount() : getCategoryCount(categoryKey);
        
        if (categoryKey !== "all" && count === 0) {
          return null;
        }
        
        return (
          <option key={categoryKey} value={categoryKey}>
            {config.icon} {config.shortLabel} {count > 0 ? `(${count})` : ''}
          </option>
        );
      })}
    </select>
  );
}