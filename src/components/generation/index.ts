// Generation Components Export
export { UploadInterface } from './UploadInterface';
export { GenerationWizard } from './GenerationWizard';
export { ProgressTracker, ProgressTrackerCompact } from './ProgressTracker';

// Types
export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

export interface GenerationSettings {
  productName?: string;
  productDescription?: string;
  category: import('@/lib/prompt-engineering').ProductCategory;
  style: import('@/lib/prompt-engineering').MockupStyle;
  lighting?: import('@/lib/prompt-engineering').LightingCondition;
  background?: import('@/lib/prompt-engineering').Background;
  quality: import('@/lib/replicate').GenerationQuality;
  customPrompt?: string;
  negativePrompt?: string;
  includeHands?: boolean;
  angle?: 'front' | 'side' | 'top' | 'angled' | '3quarter';
  mood?: 'professional' | 'casual' | 'luxury' | 'modern' | 'vintage';
  variations?: number;
  batchSize?: number;
}