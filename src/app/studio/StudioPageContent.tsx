'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Wand2, Download, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { DragDropZone } from '@/components/upload/DragDropZone';
import { cn } from '@/lib/utils';

interface GenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
}

export default function StudioPageContent() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<any[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
    mutationFn: async (data: any) => {
      console.log('🚀 Starting AI generation:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, return a mock success response
      return {
        success: true,
        data: {
          jobId: `job_${Date.now()}`,
          mockupId: `mockup_${Date.now()}`,
          status: 'processing'
        }
      };
    },
    onSuccess: (data) => {
      console.log('✅ Generation started:', data);
      
      // Create a new job
      const newJob: GenerationJob = {
        id: data.data.jobId,
        status: 'processing',
        progress: 0
      };
      
      setGenerationJobs(prev => [...prev, newJob]);
      setIsGenerating(true);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationJobs(prev => 
          prev.map(job => 
            job.id === newJob.id 
              ? { ...job, progress: Math.min(job.progress + 20, 100) }
              : job
          )
        );
      }, 500);
      
      // Complete after 3 seconds
      setTimeout(() => {
        clearInterval(progressInterval);
        setGenerationJobs(prev => 
          prev.map(job => 
            job.id === newJob.id 
              ? { 
                  ...job, 
                  status: 'completed', 
                  progress: 100,
                  result: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center'
                }
              : job
          )
        );
        setIsGenerating(false);
      }, 3000);
    },
    onError: (error: Error) => {
      console.error('❌ Generation failed:', error);
      setIsGenerating(false);
    }
  });

  const handleFilesUploaded = (files: File[], uploadedData?: any[]) => {
    console.log('📁 Files uploaded:', files);
    setUploadedFiles(files);
    if (uploadedData && uploadedData.length > 0) {
      setUploadedFileData(uploadedData);
    }
  };

  // Handle mockup generation
  const handleGenerateMockup = useCallback(async () => {
    if (!uploadedFiles.length) {
      alert('Please upload an image first!');
      return;
    }

    try {
      console.log('🎨 Starting mockup generation...');
      
      let productImage: string | undefined;

      // Use storage URL if available, otherwise fallback to base64
      if (uploadedFileData.length > 0) {
        productImage = uploadedFileData[0].publicUrl;
      } else {
        productImage = await fileToBase64(uploadedFiles[0]);
      }

      // Prepare generation request
      const request = {
        productName: "User Upload",
        productDescription: "AI Generated Mockup",
        productImage,
        category: "digital",
        style: "studio",
        quality: "standard"
      };
      
      console.log('📤 Sending generation request:', {
        ...request,
        productImage: productImage ? `${productImage.substring(0, 50)}...` : undefined
      });

      generateMockup.mutate(request);

    } catch (error) {
      console.error('❌ Failed to prepare generation request:', error);
      alert('Failed to prepare generation request. Please try again.');
    }
  }, [uploadedFiles, uploadedFileData, fileToBase64, generateMockup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900" data-testid="studio-container">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/10 animate-pulse" />
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(255, 140, 0, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.3) 0%, transparent 50%)',
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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
            MockupMagic AI
          </h1>
          <p className="text-gray-300 text-lg">
            Upload your image and generate a professional mockup in seconds
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Upload Section */}
            <LiquidGlassCard variant="medium" glow className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-semibold text-white">1. Upload Your Image</h2>
              </div>

              <DragDropZone onFilesUploaded={handleFilesUploaded} />

              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded successfully!
                    </span>
                  </div>
                </motion.div>
              )}
            </LiquidGlassCard>

            {/* Generate Section */}
            <LiquidGlassCard variant="medium" glow className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Wand2 className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-semibold text-white">2. Generate Mockup</h2>
              </div>

              {/* Error State */}
              {generateMockup.error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-300 font-medium">Generation Failed</p>
                    <p className="text-red-400 text-sm">{generateMockup.error.message}</p>
                  </div>
                </div>
              )}

              {/* Generation Jobs */}
              {generationJobs.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
                  {generationJobs.map((job) => (
                    <div key={job.id} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Mockup Generation</span>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'processing' ? 'bg-orange-500/20 text-orange-400' :
                          job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        )}>
                          {job.status === 'queued' ? 'In Queue' :
                           job.status === 'processing' ? 'Processing' :
                           job.status === 'completed' ? 'Complete' : 'Failed'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {job.status === 'processing' && (
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <motion.div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {job.error && (
                        <p className="text-red-400 text-sm">{job.error}</p>
                      )}

                      {/* Result Image */}
                      {job.status === 'completed' && job.result && (
                        <div className="mt-4">
                          <img 
                            src={job.result} 
                            alt="Generated mockup" 
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                          <button
                            className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            onClick={() => {
                              // Download the image
                              const link = document.createElement('a');
                              link.href = job.result!;
                              link.download = `mockup-${job.id}.jpg`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Download Mockup
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Generate Button */}
              <LiquidGlassButton
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateMockup}
                disabled={!uploadedFiles.length || isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Generating Mockup...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Generate Mockup
                  </div>
                )}
              </LiquidGlassButton>

              {!uploadedFiles.length && (
                <p className="text-gray-400 text-sm text-center mt-3">
                  Upload an image first to generate a mockup
                </p>
              )}
            </LiquidGlassCard>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <LiquidGlassCard variant="shallow" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-orange-400" />
                  </div>
                  <h4 className="font-medium text-white mb-2">1. Upload</h4>
                  <p className="text-gray-400">Upload your product image or design</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wand2 className="w-6 h-6 text-orange-400" />
                  </div>
                  <h4 className="font-medium text-white mb-2">2. Generate</h4>
                  <p className="text-gray-400">AI creates a professional mockup</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-orange-400" />
                  </div>
                  <h4 className="font-medium text-white mb-2">3. Download</h4>
                  <p className="text-gray-400">Get your mockup ready to use</p>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}