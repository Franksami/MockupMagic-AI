// Template Components Export
export { TemplateGallery } from './TemplateGallery';
export { TemplateCard } from './TemplateCard';
export { TemplateEditor } from './TemplateEditor';
export { CategoryFilter, CategoryFilterCompact } from './CategoryFilter';
export { TemplateSearch, TemplateSearchCompact } from './TemplateSearch';

// Component Types
export type { default as Template } from './TemplateCard';

// Re-export types from prompt engineering for convenience
export type { 
  ProductCategory, 
  MockupStyle, 
  LightingCondition, 
  Background 
} from '@/lib/prompt-engineering';