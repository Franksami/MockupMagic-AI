'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Palette, Settings, Zap, ShoppingBag, BarChart3, Grid, AlertCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { DragDropZone } from '@/components/upload/DragDropZone';
import { TemplateSelector } from '@/components/generation/TemplateSelector';
import { CreditDashboard } from '@/components/billing';
import { TemplateMarketplace } from '@/components/community/TemplateMarketplace';
import { WhopStoreIntegration } from '@/components/whop/WhopStoreIntegration';
import { ROIAnalyticsDashboard } from '@/components/analytics/ROIAnalyticsDashboard';
import { useWhop } from '@/components/providers/whop-provider';
import { cn } from '@/lib/utils';

type TabType = 'studio' | 'templates' | 'store' | 'results';

interface GenerationRequest {
  productName?: string;
  productDescription?: string;
  productImage?: string;
  templateId?: string;
  category: string;
  style: string;
  quality: string;
}

interface GenerationJob {
  jobId: string;
  mockupId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  generatedImageId?: string;
  error?: string;
}

export default function StudioPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<'upload' | 'customize' | 'generate'>('upload');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [generationResults, setGenerationResults] = useState<GenerationJob[]>([]);
  const { whopUser, isAuthenticated } = useWhop();

  // Helper function to convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  // Generate mockup mutation
  const generateMockup = useMutation({
    mutationFn: async (data: GenerationRequest) => {
      console.log('Sending generation request:', data);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include authentication cookies
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = 'Generation failed';
        
        try {
          const errorResponse = await response.json();
          console.error('API Error Response:', errorResponse);
          
          errorMessage = errorResponse.error?.message || 
                        errorResponse.message || 
                        `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setActiveJobIds(data.data.jobIds);
        // Initialize generation results with job IDs
        const jobs: GenerationJob[] = data.data.jobIds.map((jobId: string, index: number) => ({
          jobId,
          mockupId: data.data.mockupIds[index],
          status: 'queued' as const
        }));
        setGenerationResults(jobs);
      }
    },
    onError: (error: Error) => {
      console.error('Generation failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // TODO: Show error toast notification
    }
  });

  // Poll job status for active jobs
  const { data: jobStatuses } = useQuery({
    queryKey: ['jobStatuses', activeJobIds],
    queryFn: async () => {
      if (activeJobIds.length === 0) return [];

      const promises = activeJobIds.map(async (jobId) => {
        const response = await fetch(`/api/generate?jobId=${jobId}`, {
          credentials: 'include' // Include authentication cookies
        });
        if (!response.ok) {
          const errorResponse = await response.json().catch(() => ({}));
          const errorMessage = errorResponse.error?.message || errorResponse.message || 'Failed to fetch job status';
          throw new Error(errorMessage);
        }
        return response.json();
      });

      return Promise.all(promises);
    },
    enabled: activeJobIds.length > 0,
    refetchInterval: (data) => {
      // Stop polling if all jobs are completed or failed
      if (!data || !Array.isArray(data)) {
        return false; // Stop polling if data is invalid
      }
      
      const hasActiveJobs = data.some((result) =>
        result.success && ['queued', 'processing'].includes(result.data?.status)
      );
      return hasActiveJobs ? 2000 : false; // Poll every 2 seconds
    }
  });

  // Update generation results when job statuses change
  React.useEffect(() => {
    if (jobStatuses) {
      setGenerationResults(prev =>
        prev.map((job, index) => {
          const statusResult = jobStatuses[index];
          if (statusResult?.success && statusResult.data) {
            return {
              ...job,
              status: statusResult.data.status,
              progress: statusResult.data.progress,
              generatedImageId: statusResult.data.generatedImageId,
              error: statusResult.data.error
            };
          }
          return job;
        })
      );

      // If all jobs are completed/failed, clear active job IDs
      const allCompleted = jobStatuses.every((result) =>
        result.success && ['completed', 'failed'].includes(result.data?.status)
      );
      if (allCompleted) {
        setActiveJobIds([]);
      }
    }
  }, [jobStatuses]);

  // Get active tab from URL params, default to 'studio'
  const activeTab = (searchParams.get('tab') as TabType) || 'studio';

  // Create URL with new tab parameter
  const createTabUrl = useCallback(
    (tab: TabType) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'studio') {
        params.delete('tab'); // Remove tab param for default studio view
      } else {
        params.set('tab', tab);
      }
      return pathname + (params.toString() ? '?' + params.toString() : '');
    },
    [pathname, searchParams]
  );

  const handleFilesUploaded = (files: File[], uploadedData?: any[]) => {
    setUploadedFiles(files);

    // Store uploaded file data when available
    if (uploadedData && uploadedData.length > 0) {
      setUploadedFileData(uploadedData);
    }

    // Auto-advance to customize step after upload
    setTimeout(() => setActiveStep('customize'), 1000);
  };

  const handleSelectTemplate = (template: { id: string }) => {
    setSelectedTemplateId(template.id);
  };

  // Handle mockup generation
  const handleGenerateMockup = useCallback(async () => {
    if (!isAuthenticated || !uploadedFiles.length) {
      console.error('Authentication required and files must be uploaded');
      return;
    }

    try {
      let productImage: string | undefined;

      // Use storage URL if available, otherwise fallback to base64
      if (uploadedFileData.length > 0) {
        productImage = uploadedFileData[0].publicUrl;
      } else {
        // Fallback to base64 conversion for compatibility
        productImage = await fileToBase64(uploadedFiles[0]);
      }

      // Prepare generation request
      const request: GenerationRequest = {
        productName: "User Upload",
        productDescription: "AI Generated Mockup",
        productImage,
        templateId: selectedTemplateId,
        category: "digital", // Default category
        style: "studio", // Default style
        quality: "standard" // Default quality
      };
      
      console.log('Prepared generation request:', {
        ...request,
        productImage: productImage ? `${productImage.substring(0, 50)}...` : undefined
      });

      // Start generation and switch to generate step
      setActiveStep('generate');
      generateMockup.mutate(request);

    } catch (error) {
      console.error('Failed to prepare generation request:', error);
      // TODO: Show error toast
    }
  }, [isAuthenticated, uploadedFiles, uploadedFileData, selectedTemplateId, fileToBase64, generateMockup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" data-testid="studio-container">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            MockupMagic AI
          </h1>
          <p className="text-gray-300 text-lg">
            Transform your designs into stunning mockups with AI
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <LiquidGlassContainer
            variant="shallow"
            className="flex items-center gap-2 px-2 py-2 rounded-full"
          >
            {[
              { id: 'studio', label: 'Studio', icon: Wand2, description: 'Create AI mockups' },
              { id: 'templates', label: 'Templates', icon: Grid, description: 'Browse community templates' },
              { id: 'store', label: 'Store', icon: ShoppingBag, description: 'Connect your Whop store' },
              { id: 'results', label: 'Results', icon: BarChart3, description: 'Track your ROI' },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => router.push(createTabUrl(tab.id as TabType))}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-full transition-all text-sm font-medium',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                style={{ willChange: 'transform' }}
                title={tab.description}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </LiquidGlassContainer>
        </div>

        {/* Tab Content */}
        {activeTab === 'studio' && (
          <>
            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
          <LiquidGlassContainer
            variant="shallow"
            className="flex items-center gap-8 px-8 py-4 rounded-full"
          >
            {[
              { id: 'upload', label: 'Upload', icon: Sparkles },
              { id: 'customize', label: 'Customize', icon: Palette },
              { id: 'generate', label: 'Generate', icon: Zap },
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <motion.button
                  onClick={() => setActiveStep(step.id as 'upload' | 'customize' | 'generate')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    activeStep === step.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <step.icon className="w-5 h-5" />
                  <span className="font-medium">{step.label}</span>
                </motion.button>
                {index < 2 && (
                  <div className="w-12 h-0.5 bg-gray-600">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: '0%' }}
                      animate={{
                        width: activeStep === 'generate' || (activeStep === 'customize' && index === 0) ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </LiquidGlassContainer>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload/Preview Section */}
          <div className="lg:col-span-2">
            <LiquidGlassCard
              variant="medium"
              glow
              className="p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {activeStep === 'upload' && 'Upload Your Images'}
                  {activeStep === 'customize' && 'Customize Your Mockup'}
                  {activeStep === 'generate' && 'AI Generation'}
                </h2>
                <Wand2 className="w-6 h-6 text-purple-400" />
              </div>

              {activeStep === 'upload' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <DragDropZone onFilesUploaded={handleFilesUploaded} />
                </motion.div>
              )}

              {activeStep === 'customize' && uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <TemplateSelector
                    onSelectTemplate={handleSelectTemplate}
                    selectedTemplateId={selectedTemplateId}
                    className="h-96"
                  />
                </motion.div>
              )}

              {activeStep === 'generate' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Error State */}
                  {generateMockup.error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-red-300 font-medium">Generation Failed</p>
                        <p className="text-red-400 text-sm">{generateMockup.error.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Job Status Display */}
                  {generationResults.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white mb-4">Generation Progress</h3>
                      {generationResults.map((job, index) => (
                        <div key={job.jobId} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300">Mockup {index + 1}</span>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              job.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                              job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            )}>
                              {job.status === 'queued' ? 'In Queue' :
                               job.status === 'processing' ? 'Processing' :
                               job.status === 'completed' ? 'Complete' : 'Failed'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          {job.status === 'processing' && job.progress && (
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}

                          {/* Error Message */}
                          {job.error && (
                            <p className="text-red-400 text-sm">{job.error}</p>
                          )}

                          {/* Download Button for Completed Jobs */}
                          {job.status === 'completed' && job.generatedImageId && (
                            <button
                              className="mt-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/download?id=${job.generatedImageId}`;
                                link.download = `mockup-${job.mockupId}.png`;
                                link.click();
                              }}
                            >
                              Download Mockup
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : generateMockup.isPending ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-16 h-16 text-purple-400 mb-4" />
                      </motion.div>
                      <p className="text-xl text-white font-medium">Starting generation...</p>
                      <p className="text-gray-400 mt-2">Please wait while we prepare your mockup</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <p className="text-xl text-white font-medium">Ready to generate</p>
                      <p className="text-gray-400 mt-2">Click "Generate Mockup" to start</p>
                    </div>
                  )}
                </motion.div>
              )}
            </LiquidGlassCard>
          </div>

          {/* Settings/Options Panel */}
          <div className="space-y-6">
            {/* Credit Dashboard */}
            {isAuthenticated && whopUser && (
              <CreditDashboard userId={whopUser.id} />
            )}

            <LiquidGlassCard variant="medium" className="p-6" data-testid="liquid-glass">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Quick Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Background</label>
                  <select className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                    <option>Gradient</option>
                    <option>Solid Color</option>
                    <option>Transparent</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Quality</label>
                  <select className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                    <option>Standard</option>
                    <option>High</option>
                    <option>Premium</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Format</label>
                  <select className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                    <option>PNG</option>
                    <option>JPG</option>
                    <option>WebP</option>
                  </select>
                </div>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard variant="medium" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Enhancement</h3>
              <div className="space-y-3">
                {[
                  'Remove Background',
                  'Auto-Enhance Colors',
                  'Smart Cropping',
                  'Add Shadows',
                ].map((feature) => (
                  <label key={feature} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-300">{feature}</span>
                  </label>
                ))}
              </div>
            </LiquidGlassCard>

            <LiquidGlassButton
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (activeStep === 'upload') {
                  setActiveStep('customize');
                } else if (activeStep === 'customize') {
                  handleGenerateMockup();
                }
              }}
              disabled={
                (activeStep === 'customize' && (!uploadedFiles.length || generateMockup.isPending)) ||
                (activeStep === 'generate' && generateMockup.isPending)
              }
            >
              {activeStep === 'upload' && 'Continue to Customize'}
              {activeStep === 'customize' && (
                generateMockup.isPending ? 'Starting Generation...' : 'Generate Mockup'
              )}
              {activeStep === 'generate' && (
                generateMockup.isPending ? 'Processing...' : 'Generate Complete'
              )}
            </LiquidGlassButton>
          </div>
        </div>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TemplateMarketplace />
          </motion.div>
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WhopStoreIntegration />
          </motion.div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ROIAnalyticsDashboard />
          </motion.div>
        )}
      </div>
    </div>
  );
}
