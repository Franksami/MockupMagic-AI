"use client";

import { useState, useEffect } from "react";
import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useFrostedUI } from "@/components/providers/frosted-provider";
import { useWhop } from "@/components/providers/whop-provider";
import { UploadInterface } from "./UploadInterface";
import { TemplateGallery } from "../templates/TemplateGallery";
import { 
  generateMockupPrompt,
  type ProductCategory,
  type MockupStyle,
  type LightingCondition,
  type Background
} from "@/lib/prompt-engineering";
import type { GenerationQuality } from "@/lib/replicate";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

interface GenerationSettings {
  productName?: string;
  productDescription?: string;
  category: ProductCategory;
  style: MockupStyle;
  lighting?: LightingCondition;
  background?: Background;
  quality: GenerationQuality;
  customPrompt?: string;
  negativePrompt?: string;
  includeHands?: boolean;
  angle?: 'front' | 'side' | 'top' | 'angled' | '3quarter';
  mood?: 'professional' | 'casual' | 'luxury' | 'modern' | 'vintage';
  variations?: number;
  batchSize?: number;
}

interface GenerationWizardProps {
  onGenerate?: (files: UploadedFile[], settings: GenerationSettings) => void;
  onCancel?: () => void;
  initialSettings?: Partial<GenerationSettings>;
}

type WizardStep = 'upload' | 'template' | 'settings' | 'review';

export function GenerationWizard({
  onGenerate,
  onCancel,
  initialSettings = {}
}: GenerationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
  
  const { showNotification } = useFrostedUI();
  const { convexUser } = useWhop();
  
  const [settings, setSettings] = useState<GenerationSettings>({
    category: 'digital',
    style: 'studio',
    lighting: 'studio',
    background: 'white',
    quality: 'standard',
    variations: 1,
    batchSize: 1,
    includeHands: false,
    angle: 'front',
    mood: 'professional',
    ...initialSettings
  });

  const userCredits = convexUser?.creditsRemaining || 0;
  const userTier = convexUser?.subscriptionTier || 'starter';

  // Calculate estimated credits when settings change
  useEffect(() => {
    const creditCosts = {
      draft: 1,
      standard: 2,
      premium: 4
    };
    
    const baseCredits = creditCosts[settings.quality];
    const totalCredits = baseCredits * (settings.variations || 1) * (settings.batchSize || 1) * uploadedFiles.length;
    setEstimatedCredits(totalCredits);
    
    // Estimate wait time based on queue (mock calculation)
    const estimatedTime = totalCredits * 30; // 30 seconds per credit
    setEstimatedWaitTime(estimatedTime);
  }, [settings.quality, settings.variations, settings.batchSize, uploadedFiles.length]);

  const steps: { key: WizardStep; title: string; description: string; completed: boolean }[] = [
    {
      key: 'upload',
      title: 'Upload Images',
      description: 'Upload the images you want to create mockups for',
      completed: uploadedFiles.length > 0
    },
    {
      key: 'template',
      title: 'Choose Template',
      description: 'Select a template or customize your mockup style',
      completed: selectedTemplate !== null || settings.style !== 'studio'
    },
    {
      key: 'settings',
      title: 'Configure Settings',
      description: 'Adjust quality, style, and generation options',
      completed: true // Always considered completed
    },
    {
      key: 'review',
      title: 'Review & Generate',
      description: 'Review your settings and start generation',
      completed: false
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const canProceed = steps[currentStepIndex]?.completed || false;
  const isLastStep = currentStep === 'review';
  const isFirstStep = currentStep === 'upload';

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleStepClick = (step: WizardStep) => {
    const stepIndex = steps.findIndex(s => s.key === step);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    // Only allow going to completed steps or the next step
    if (stepIndex <= currentIndex || steps[stepIndex - 1]?.completed) {
      setCurrentStep(step);
    }
  };

  const handleFilesUpload = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    if (template) {
      setSettings(prev => ({
        ...prev,
        category: template.category,
        style: template.config.defaultSettings.style,
        lighting: template.config.defaultSettings.lighting,
        background: template.config.defaultSettings.background,
        quality: template.config.defaultSettings.quality,
        customPrompt: template.config.basePrompt
      }));
    }
  };

  const handleSettingChange = (field: keyof GenerationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (uploadedFiles.length === 0) {
      showNotification("Please upload at least one image", "error");
      return;
    }

    if (estimatedCredits > userCredits) {
      showNotification(
        `Insufficient credits. Need ${estimatedCredits}, have ${userCredits}`, 
        "error"
      );
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate?.(uploadedFiles, settings);
    } catch (error) {
      console.error('Generation error:', error);
      showNotification("Generation failed. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <UploadInterface
              onFilesUpload={handleFilesUpload}
              onFileRemove={handleFileRemove}
              maxFiles={userTier === 'starter' ? 3 : userTier === 'growth' ? 5 : 10}
              maxFileSize={convexUser?.limits?.maxFileSize || 10}
            />
            
            {uploadedFiles.length > 0 && (
              <FrostedCard className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-green-300 font-medium">Files uploaded successfully!</p>
                    <p className="text-green-200 text-sm">
                      {uploadedFiles.length} image{uploadedFiles.length > 1 ? 's' : ''} ready for mockup generation
                    </p>
                  </div>
                </div>
              </FrostedCard>
            )}
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Choose a Template</h3>
                <p className="text-gray-400 text-sm">
                  Select a pre-made template or continue with custom settings
                </p>
              </div>
              <FrostedButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(null);
                  showNotification("Using custom settings", "info");
                }}
              >
                Skip Templates
              </FrostedButton>
            </div>
            
            <TemplateGallery
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?._id}
              category={settings.category}
              maxHeight="400px"
            />
            
            {selectedTemplate && (
              <FrostedCard className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-blue-300 font-medium">Template selected: {selectedTemplate.name}</p>
                    <p className="text-blue-200 text-sm">{selectedTemplate.description}</p>
                  </div>
                </div>
              </FrostedCard>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Generation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <FrostedCard className="p-4">
                  <h4 className="font-semibold text-white mb-3">Basic Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={settings.productName || ''}
                        onChange={(e) => handleSettingChange('productName', e.target.value)}
                        placeholder="e.g., iPhone App"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={settings.category}
                        onChange={(e) => handleSettingChange('category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Style
                      </label>
                      <select
                        value={settings.style}
                        onChange={(e) => handleSettingChange('style', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Quality
                      </label>
                      <select
                        value={settings.quality}
                        onChange={(e) => handleSettingChange('quality', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">Draft - 1 credit (512x512)</option>
                        <option value="standard">Standard - 2 credits (1024x1024)</option>
                        <option value="premium">Premium - 4 credits (1536x1536)</option>
                      </select>
                    </div>
                  </div>
                </FrostedCard>

                {/* Advanced Settings */}
                <FrostedCard className="p-4">
                  <h4 className="font-semibold text-white mb-3">Advanced Options</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Variations
                        </label>
                        <select
                          value={settings.variations}
                          onChange={(e) => handleSettingChange('variations', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1 variation</option>
                          <option value={2}>2 variations</option>
                          <option value={3}>3 variations</option>
                          {['pro', 'enterprise'].includes(userTier) && (
                            <>
                              <option value={4}>4 variations</option>
                              <option value={5}>5 variations</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Angle
                        </label>
                        <select
                          value={settings.angle}
                          onChange={(e) => handleSettingChange('angle', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="front">Front View</option>
                          <option value="side">Side View</option>
                          <option value="top">Top View</option>
                          <option value="angled">Angled</option>
                          <option value="3quarter">Three Quarter</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Mood
                      </label>
                      <select
                        value={settings.mood}
                        onChange={(e) => handleSettingChange('mood', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="luxury">Luxury</option>
                        <option value="modern">Modern</option>
                        <option value="vintage">Vintage</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="includeHands"
                        checked={settings.includeHands}
                        onChange={(e) => handleSettingChange('includeHands', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="includeHands" className="text-gray-300 text-sm">
                        Include hands holding product
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Custom Prompt (Optional)
                      </label>
                      <textarea
                        value={settings.customPrompt || ''}
                        onChange={(e) => handleSettingChange('customPrompt', e.target.value)}
                        placeholder="Add specific details or requirements..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </FrostedCard>
              </div>
            </div>
          </div>
        );

      case 'review':
        const promptPreview = generateMockupPrompt({
          productName: settings.productName,
          productDescription: settings.productDescription,
          category: settings.category,
          style: settings.style,
          lighting: settings.lighting,
          background: settings.background,
          customPrompt: settings.customPrompt,
          includeHands: settings.includeHands,
          angle: settings.angle,
          mood: settings.mood
        });

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Review Your Generation</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary */}
                <FrostedCard className="p-4">
                  <h4 className="font-semibold text-white mb-3">Generation Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Files:</span>
                      <span className="text-white">{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Template:</span>
                      <span className="text-white">
                        {selectedTemplate ? selectedTemplate.name : 'Custom Settings'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Style:</span>
                      <span className="text-white capitalize">{settings.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Quality:</span>
                      <span className="text-white capitalize">{settings.quality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Variations:</span>
                      <span className="text-white">{settings.variations} per image</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-600 pt-3">
                      <span className="text-gray-300">Total Credits:</span>
                      <span className={estimatedCredits > userCredits ? 'text-red-400' : 'text-green-400'}>
                        {estimatedCredits}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Estimated Time:</span>
                      <span className="text-white">
                        {Math.ceil(estimatedWaitTime / 60)} minutes
                      </span>
                    </div>
                  </div>
                </FrostedCard>

                {/* Prompt Preview */}
                <FrostedCard className="p-4">
                  <h4 className="font-semibold text-white mb-3">Generated Prompt</h4>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300 max-h-48 overflow-y-auto">
                    {promptPreview.enhancedPrompt}
                  </div>
                </FrostedCard>
              </div>

              {/* Warning if insufficient credits */}
              {estimatedCredits > userCredits && (
                <FrostedCard className="p-4 bg-red-500/10 border-red-500/30">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-red-300 font-medium">Insufficient Credits</p>
                      <p className="text-red-200 text-sm">
                        You need {estimatedCredits} credits but only have {userCredits}. 
                        Please reduce variations or upgrade your plan.
                      </p>
                    </div>
                  </div>
                </FrostedCard>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Steps */}
      <FrostedCard className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div 
                className={`flex items-center cursor-pointer ${
                  step.completed || step.key === currentStep ? 'opacity-100' : 'opacity-50'
                }`}
                onClick={() => handleStepClick(step.key)}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step.key === currentStep 
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' 
                    : step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }
                `}>
                  {step.completed ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step.key === currentStep ? 'text-white' : 'text-gray-300'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-4 transition-colors
                  ${step.completed ? 'bg-green-500' : 'bg-gray-600'}
                `} />
              )}
            </div>
          ))}
        </div>
      </FrostedCard>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <FrostedCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <FrostedButton
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </FrostedButton>
            
            {!isFirstStep && (
              <FrostedButton
                variant="secondary"
                onClick={handlePrevious}
              >
                Previous
              </FrostedButton>
            )}
          </div>

          <div className="text-sm text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </div>

          <div>
            {isLastStep ? (
              <FrostedButton
                variant="primary"
                onClick={handleGenerate}
                disabled={!canProceed || estimatedCredits > userCredits || isGenerating}
              >
                {isGenerating ? 'Generating...' : `Generate Mockups (${estimatedCredits} credits)`}
              </FrostedButton>
            ) : (
              <FrostedButton
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next
              </FrostedButton>
            )}
          </div>
        </div>
      </FrostedCard>
    </div>
  );
}