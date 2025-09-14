'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { LiquidGlassContainer } from '@/components/ui/LiquidGlassContainer';
import { cn, formatBytes, validateImageFile } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  storageId?: string;
  publicUrl?: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    storageId: string;
    publicUrl: string;
    filename: string;
    contentType: string;
    size: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface UploadedFileData {
  file: File;
  storageId: string;
  publicUrl: string;
  filename: string;
  contentType: string;
  size: number;
}

interface DragDropZoneProps {
  onFilesUploaded: (files: File[], uploadedData?: UploadedFileData[]) => void;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesUploaded,
  maxFiles = 20,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  className,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCancelled, setUploadCancelled] = useState(false);

  // Upload function with progress tracking using XMLHttpRequest
  const uploadFileWithProgress = useCallback((
    file: File,
    fileId: string,
    onProgress: (progress: number) => void
  ): Promise<UploadResponse> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.round(progress));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      // Start upload
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }, []);

  // Function to handle uploading multiple files
  const uploadFiles = useCallback(async (filesToUpload: UploadedFile[]) => {
    const uploadedData: UploadedFileData[] = [];

    for (const uploadFile of filesToUpload) {
      try {
        // Mark file as uploading
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

        // Upload with progress tracking
        const result = await uploadFileWithProgress(
          uploadFile.file,
          uploadFile.id,
          (progress) => {
            setFiles(prev =>
              prev.map(f =>
                f.id === uploadFile.id
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        // Mark as successful and collect upload data
        if (result.success && result.data) {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: 'success',
                    progress: 100,
                    storageId: result.data!.storageId,
                    publicUrl: result.data!.publicUrl
                  }
                : f
            )
          );

          // Add to uploaded data collection
          uploadedData.push({
            file: uploadFile.file,
            storageId: result.data.storageId,
            publicUrl: result.data.publicUrl,
            filename: result.data.filename,
            contentType: result.data.contentType,
            size: result.data.size
          });

        } else {
          throw new Error('Upload failed: Invalid response');
        }

      } catch (error) {
        console.error(`Upload failed for ${uploadFile.file.name}:`, error);

        // Mark as failed
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : f
          )
        );
      }
    }

    // Notify parent component with successful uploads
    if (uploadedData.length > 0) {
      const successfulFiles = uploadedData.map(data => data.file);
      onFilesUploaded(successfulFiles, uploadedData);
    }
  }, [uploadFileWithProgress, onFilesUploaded]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
        const validation = validateImageFile(file);
        return {
          id: Math.random().toString(36).substring(7),
          file,
          preview: URL.createObjectURL(file),
          status: validation.valid ? 'pending' : 'error',
          progress: 0,
          error: validation.error,
        };
      });

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));

      const validFiles = newFiles.filter((f) => f.status === 'pending');
      const validFileObjects = validFiles.map((f) => f.file);

      if (validFiles.length > 0) {
        // Immediately call onFilesUploaded with file objects for UI feedback
        onFilesUploaded(validFileObjects);

        // Start real upload process
        uploadFiles(validFiles);
      }
    },
    [maxFiles, onFilesUploaded, uploadFiles]
  );


  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
        // If file was uploading, show cancelled message
        if (file.status === 'uploading') {
          setUploadCancelled(true);
          setTimeout(() => setUploadCancelled(false), 3000);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxSize,
    multiple,
    maxFiles,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  return (
    <div className={cn('w-full', className)}>
      <LiquidGlassContainer
        variant="medium"
        interactive
        shimmer={isDragging}
        glow={isDragActive}
        color={isDragReject ? 'danger' : isDragActive ? 'primary' : 'default'}
        className="relative overflow-hidden"
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative cursor-pointer transition-all duration-300',
            'min-h-[300px] flex flex-col items-center justify-center p-8',
            'border-2 border-dashed rounded-xl',
            isDragActive && 'border-indigo-500 bg-indigo-500/5 drag-over active',
            isDragReject && 'border-red-500 bg-red-500/5',
            !isDragActive && !isDragReject && 'border-gray-300 dark:border-gray-600'
          )}
          data-testid="drag-drop-zone"
          role="button"
          aria-label="Upload files by drag and drop or click to browse"
          tabIndex={0}
        >
          <input {...getInputProps()} />

          <AnimatePresence mode="wait">
            {isDragActive ? (
              <motion.div
                key="drag"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                </motion.div>
                <p className="text-lg font-semibold text-indigo-600">
                  Drop your images here
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Release to upload
                </p>
              </motion.div>
            ) : isDragReject ? (
              <motion.div
                key="reject"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold text-red-600" data-testid="upload-error">
                  Invalid file type
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Only images are accepted
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Drag & drop your images here
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Supports: PNG, JPG, WEBP (Max {formatBytes(maxSize)})
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated background effect */}
          <AnimatePresence>
            {isDragActive && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LiquidGlassContainer>

      {/* Upload Cancelled Message */}
      {uploadCancelled && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg" data-testid="upload-cancelled">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">Upload cancelled</p>
        </div>
      )}

      {/* File preview grid */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                data-testid="file-preview"
              >
                <LiquidGlassContainer
                  variant="shallow"
                  className="relative group overflow-hidden rounded-lg"
                >
                  <div className="aspect-square relative">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                        data-testid="cancel-upload"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Status indicator */}
                    <div className="absolute bottom-2 left-2 right-2">
                      {file.status === 'uploading' && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2" data-testid="upload-progress" data-complete={file.progress === 100 ? "true" : "false"}>
                          <div className="flex items-center justify-between">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-xs font-medium text-gray-700">
                              {Math.round(file.progress)}%
                            </span>
                          </div>
                          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                      {file.status === 'success' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-500/90 backdrop-blur-sm rounded-full p-2 flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </motion.div>
                      )}

                      {file.status === 'error' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-red-500/90 backdrop-blur-sm rounded-full p-2"
                          data-testid="upload-error"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-white" />
                            <span className="text-xs text-white truncate">
                              {file.error}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(file.file.size)}
                    </p>
                  </div>
                </LiquidGlassContainer>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};