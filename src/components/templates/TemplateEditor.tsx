"use client";

import { useState, useEffect } from "react";
import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useFrostedUI } from "@/components/providers/frosted-provider";
import { useWhop } from "@/components/providers/whop-provider";
import { 
  generateMockupPrompt, 
  analyzePrompt,
  type ProductCategory, 
  type MockupStyle,
  type LightingCondition,
  type Background
} from "@/lib/prompt-engineering";

interface TemplateEditorProps {
  template?: any; // Existing template for editing
  onSave?: (templateData: any) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export function TemplateEditor({ 
  template, 
  onSave, 
  onCancel,
  mode = 'create'
}: TemplateEditorProps) {
  const { showNotification } = useFrostedUI();
  const { convexUser } = useWhop();
  const [isSaving, setIsSaving] = useState(false);
  
  // Template form state
  const [formData, setFormData] = useState({
    name: template?.name || "",
    slug: template?.slug || "",
    description: template?.description || "",
    category: template?.category || "digital" as ProductCategory,
    subCategory: template?.subCategory || "",
    config: {
      mockupType: template?.config?.mockupType || "product",
      basePrompt: template?.config?.basePrompt || "",
      negativePrompt: template?.config?.negativePrompt || "",
      defaultSettings: {
        style: template?.config?.defaultSettings?.style || "studio" as MockupStyle,
        lighting: template?.config?.defaultSettings?.lighting || "studio" as LightingCondition,
        background: template?.config?.defaultSettings?.background || "white" as Background,
        quality: template?.config?.defaultSettings?.quality || "standard",
        resolution: {
          width: template?.config?.defaultSettings?.resolution?.width || 1024,
          height: template?.config?.defaultSettings?.resolution?.height || 1024,
        }
      },
      supportedFormats: template?.config?.supportedFormats || ["png", "jpg"]
    },
    isPublic: template?.isPublic ?? false,
    isPremium: template?.isPremium ?? false,
    requiredTier: template?.requiredTier || "starter",
    tags: template?.tags?.join(", ") || "",
    searchKeywords: template?.searchKeywords?.join(", ") || ""
  });

  const [promptPreview, setPromptPreview] = useState<{
    prompt: string;
    negativePrompt: string;
    enhancedPrompt: string;
  } | null>(null);

  const [promptAnalysis, setPromptAnalysis] = useState<{
    score: number;
    suggestions: string[];
    missing: string[];
    strengths: string[];
  } | null>(null);

  // Generate slug from name
  useEffect(() => {
    if (formData.name && (!template || mode === 'create')) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, template, mode]);

  // Generate prompt preview
  useEffect(() => {
    if (formData.config.basePrompt) {
      try {
        const preview = generateMockupPrompt({
          category: formData.category,
          style: formData.config.defaultSettings.style,
          lighting: formData.config.defaultSettings.lighting,
          background: formData.config.defaultSettings.background,
          customPrompt: formData.config.basePrompt,
        });
        setPromptPreview(preview);

        const analysis = analyzePrompt(preview.enhancedPrompt);
        setPromptAnalysis(analysis);
      } catch (error) {
        console.error('Error generating prompt preview:', error);
        setPromptPreview(null);
        setPromptAnalysis(null);
      }
    }
  }, [
    formData.config.basePrompt,
    formData.category,
    formData.config.defaultSettings.style,
    formData.config.defaultSettings.lighting,
    formData.config.defaultSettings.background
  ]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const keys = field.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showNotification("Template name is required", "error");
      return;
    }

    if (!formData.config.basePrompt.trim()) {
      showNotification("Base prompt is required", "error");
      return;
    }

    setIsSaving(true);

    try {
      const templateData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        searchKeywords: formData.searchKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
        config: {
          ...formData.config,
          supportedFormats: formData.config.supportedFormats
        }
      };

      await onSave?.(templateData);
      showNotification(
        `Template ${mode === 'create' ? 'created' : 'updated'} successfully!`, 
        "success"
      );
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification(
        `Failed to ${mode === 'create' ? 'create' : 'update'} template`, 
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canCreatePublic = ['pro', 'enterprise'].includes(convexUser?.subscriptionTier || 'starter');
  const canCreatePremium = convexUser?.subscriptionTier === 'enterprise';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'create' ? 'Create Template' : 'Edit Template'}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === 'create' 
              ? 'Design a reusable mockup template for your projects'
              : 'Update your template configuration and settings'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <FrostedButton variant="ghost" onClick={onCancel}>
            Cancel
          </FrostedButton>
          <FrostedButton 
            variant="primary" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Update Template'}
          </FrostedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <FrostedCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Modern App Mockup"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="modern-app-mockup"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Used in URLs. Auto-generated from name if empty.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of when to use this template..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="digital">Digital Products</option>
                    <option value="physical">Physical Products</option>
                    <option value="apparel">Clothing & Apparel</option>
                    <option value="books">Books & Publications</option>
                    <option value="courses">Online Courses</option>
                    <option value="branding">Brand Identity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    placeholder="e.g., mobile apps"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </FrostedCard>

          {/* Prompt Configuration */}
          <FrostedCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Prompt Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base Prompt *
                </label>
                <textarea
                  value={formData.config.basePrompt}
                  onChange={(e) => handleInputChange('config.basePrompt', e.target.value)}
                  placeholder="Describe the mockup style and context..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be combined with category-specific enhancements
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Negative Prompt
                </label>
                <textarea
                  value={formData.config.negativePrompt}
                  onChange={(e) => handleInputChange('config.negativePrompt', e.target.value)}
                  placeholder="Things to avoid in the generation..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </FrostedCard>

          {/* Default Settings */}
          <FrostedCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Default Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style
                </label>
                <select
                  value={formData.config.defaultSettings.style}
                  onChange={(e) => handleInputChange('config.defaultSettings.style', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="studio">Studio Photography</option>
                  <option value="lifestyle">Lifestyle Setting</option>
                  <option value="minimal">Minimalist</option>
                  <option value="dramatic">Dramatic Lighting</option>
                  <option value="outdoor">Outdoor Scene</option>
                  <option value="workspace">Modern Workspace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lighting
                </label>
                <select
                  value={formData.config.defaultSettings.lighting}
                  onChange={(e) => handleInputChange('config.defaultSettings.lighting', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="soft">Soft Diffused</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="natural">Natural Daylight</option>
                  <option value="golden">Golden Hour</option>
                  <option value="studio">Studio Lighting</option>
                  <option value="ambient">Ambient</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background
                </label>
                <select
                  value={formData.config.defaultSettings.background}
                  onChange={(e) => handleInputChange('config.defaultSettings.background', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="white">Clean White</option>
                  <option value="gradient">Subtle Gradient</option>
                  <option value="textured">Textured</option>
                  <option value="scene">Contextual Scene</option>
                  <option value="minimal">Minimal</option>
                  <option value="transparent">Transparent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quality
                </label>
                <select
                  value={formData.config.defaultSettings.quality}
                  onChange={(e) => handleInputChange('config.defaultSettings.quality', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft (1 credit)</option>
                  <option value="standard">Standard (2 credits)</option>
                  <option value="premium">Premium (4 credits)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  value={formData.config.defaultSettings.resolution.width}
                  onChange={(e) => handleInputChange('config.defaultSettings.resolution.width', parseInt(e.target.value))}
                  min="256"
                  max="2048"
                  step="64"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  value={formData.config.defaultSettings.resolution.height}
                  onChange={(e) => handleInputChange('config.defaultSettings.resolution.height', parseInt(e.target.value))}
                  min="256"
                  max="2048"
                  step="64"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </FrostedCard>

          {/* Access & Visibility */}
          <FrostedCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Access & Visibility</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  disabled={!canCreatePublic}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                />
                <label htmlFor="isPublic" className="text-gray-300 text-sm">
                  Make template public
                  {!canCreatePublic && (
                    <span className="text-yellow-400 ml-2">(Pro subscription required)</span>
                  )}
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPremium"
                  checked={formData.isPremium}
                  onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                  disabled={!canCreatePremium || !formData.isPublic}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                />
                <label htmlFor="isPremium" className="text-gray-300 text-sm">
                  Premium template
                  {!canCreatePremium && (
                    <span className="text-yellow-400 ml-2">(Enterprise subscription required)</span>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Required Tier
                </label>
                <select
                  value={formData.requiredTier}
                  onChange={(e) => handleInputChange('requiredTier', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </FrostedCard>

          {/* Tags and Keywords */}
          <FrostedCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tags & Keywords</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="modern, clean, professional (comma-separated)"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated tags for categorization</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Keywords
                </label>
                <input
                  type="text"
                  value={formData.searchKeywords}
                  onChange={(e) => handleInputChange('searchKeywords', e.target.value)}
                  placeholder="app mockup, mobile design, ui (comma-separated)"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Keywords to improve search discoverability</p>
              </div>
            </div>
          </FrostedCard>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          {/* Prompt Preview */}
          {promptPreview && (
            <FrostedCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Prompt Preview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Enhanced Prompt
                  </label>
                  <div className="p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 max-h-32 overflow-y-auto">
                    {promptPreview.enhancedPrompt}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Negative Prompt
                  </label>
                  <div className="p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 max-h-24 overflow-y-auto">
                    {promptPreview.negativePrompt}
                  </div>
                </div>
              </div>
            </FrostedCard>
          )}

          {/* Prompt Analysis */}
          {promptAnalysis && (
            <FrostedCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Prompt Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Quality Score</span>
                    <span className={`text-sm font-medium ${
                      promptAnalysis.score >= 80 ? 'text-green-400' :
                      promptAnalysis.score >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {promptAnalysis.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        promptAnalysis.score >= 80 ? 'bg-green-500' :
                        promptAnalysis.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${promptAnalysis.score}%` }}
                    />
                  </div>
                </div>

                {promptAnalysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-300 mb-2">Suggestions</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {promptAnalysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {promptAnalysis.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-300 mb-2">Strengths</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {promptAnalysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </FrostedCard>
          )}
        </div>
      </div>
    </div>
  );
}