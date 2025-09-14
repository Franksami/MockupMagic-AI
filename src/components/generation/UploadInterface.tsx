"use client";

import { useState, useRef, useCallback } from "react";
import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useFrostedUI } from "@/components/providers/frosted-provider";
import { useWhop } from "@/components/providers/whop-provider";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

interface UploadInterfaceProps {
  onFilesUpload?: (files: UploadedFile[]) => void;
  onFileRemove?: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
}

export function UploadInterface({
  onFilesUpload,
  onFileRemove,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  multiple = true
}: UploadInterfaceProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useFrostedUI();
  const { convexUser } = useWhop();
  
  const userMaxFileSize = convexUser?.limits?.maxFileSize || maxFileSize;

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > userMaxFileSize) {
      return `File size (${fileSizeMB.toFixed(1)}MB) exceeds limit of ${userMaxFileSize}MB`;
    }
    
    return null;
  };

  const generateFileId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check total file count
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      showNotification(`Maximum ${maxFiles} files allowed`, "error");
      return;
    }

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      
      if (validationError) {
        showNotification(validationError, "error");
        continue;
      }

      try {
        const preview = await createFilePreview(file);
        const uploadedFile: UploadedFile = {
          id: generateFileId(),
          file,
          preview,
          status: 'pending',
          progress: 0
        };
        
        newFiles.push(uploadedFile);
      } catch (error) {
        console.error('Error creating preview:', error);
        showNotification(`Failed to process ${file.name}`, "error");
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Simulate upload process for each file
      for (const file of newFiles) {
        await simulateUpload(file.id);
      }
      
      onFilesUpload?.(newFiles);
      showNotification(`${newFiles.length} file(s) uploaded successfully`, "success");
    }

    setIsUploading(false);
  }, [uploadedFiles.length, maxFiles, userMaxFileSize, acceptedTypes, onFilesUpload, showNotification]);

  const simulateUpload = async (fileId: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'uploading' as const } : file
    ));

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadedFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, progress } : file
      ));
    }

    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'uploaded' as const, progress: 100 } : file
    ));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only stop dragging if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    onFileRemove?.(fileId);
    showNotification("File removed", "info");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.file.size, 0);
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <FrostedCard 
        className={`
          relative border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/20'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          <div className="mb-4">
            <svg 
              className={`w-12 h-12 mx-auto transition-colors ${
                isDragging ? 'text-blue-400' : 'text-gray-400'
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${
              isDragging ? 'text-blue-300' : 'text-white'
            }`}>
              {isDragging ? 'Drop your files here' : 'Upload your images'}
            </h3>
            
            <p className="text-gray-400 text-sm">
              Drag and drop your images here, or click to browse
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                Supported formats: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
              </p>
              <p>
                Max file size: {userMaxFileSize}MB • Max files: {maxFiles}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <FrostedButton variant="primary" size="lg">
              Choose Files
            </FrostedButton>
          </div>
        </div>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-white text-sm">Processing files...</p>
            </div>
          </div>
        )}
      </FrostedCard>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <FrostedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h3>
            <div className="text-sm text-gray-400">
              Total: {formatFileSize(getTotalSize())}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative group bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-900 overflow-hidden">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* File Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileRemove(file.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <div className="flex items-center space-x-2 text-xs text-yellow-400">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span>Pending</span>
                      </div>
                    )}
                    
                    {file.status === 'uploading' && (
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
                          <span>Uploading...</span>
                          <span>{file.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'uploaded' && (
                      <div className="flex items-center space-x-2 text-xs text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Uploaded</span>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center space-x-2 text-xs text-red-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Error</span>
                      </div>
                    )}
                  </div>
                  
                  {file.error && (
                    <p className="text-xs text-red-400 mt-1">
                      {file.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              {uploadedFiles.filter(f => f.status === 'uploaded').length} of {uploadedFiles.length} files uploaded
            </div>
            <div className="flex space-x-3">
              <FrostedButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUploadedFiles([]);
                  showNotification("All files removed", "info");
                }}
              >
                Clear All
              </FrostedButton>
              <FrostedButton
                size="sm"
                variant="primary"
                onClick={openFileDialog}
                disabled={uploadedFiles.length >= maxFiles}
              >
                Add More
              </FrostedButton>
            </div>
          </div>
        </FrostedCard>
      )}
    </div>
  );
}