"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FrostedCard, FrostedButton } from "@/components/providers/frosted-provider";
import { useFrostedUI } from "@/components/providers/frosted-provider";
import { useWhop } from "@/components/providers/whop-provider";

interface GenerationJob {
  _id: string;
  userId: string;
  mockupId: string;
  replicateId?: string;
  type: 'generation' | 'variation' | 'upscale';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  attempts: number;
  maxAttempts: number;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedCredits: number;
  actualCredits?: number;
  error?: string;
  metadata?: {
    prompt?: string;
    quality?: string;
    replicateStatus?: string;
    logs?: string;
    processingUpdate?: number;
  };
}

interface Mockup {
  _id: string;
  userId: string;
  prompt: string;
  mockupType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  generatedImageId?: string;
  thumbnailId?: string;
  generationTimeMs: number;
  downloads: number;
  shares: number;
  createdAt: number;
}

interface JobStatus {
  job: GenerationJob;
  mockup: Mockup;
}

interface ProgressTrackerProps {
  jobIds?: string[];
  mockupIds?: string[];
  onJobComplete?: (jobId: string, mockup: Mockup) => void;
  onAllComplete?: () => void;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ProgressTracker({
  jobIds = [],
  mockupIds = [],
  onJobComplete,
  onAllComplete,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 5000
}: ProgressTrackerProps) {
  const [trackedJobs, setTrackedJobs] = useState<string[]>(jobIds);
  const [trackedMockups, setTrackedMockups] = useState<string[]>(mockupIds);
  const [completedJobs, setCompletedJobs] = useState<Set<string>>(new Set());
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(Date.now());
  
  const { showNotification } = useFrostedUI();
  const { whopUser } = useWhop();

  // Fetch job statuses
  const { data: jobStatuses, refetch } = useQuery({
    queryKey: ['job-statuses', trackedJobs, trackedMockups],
    queryFn: async () => {
      if (trackedJobs.length === 0 && trackedMockups.length === 0) return [];
      
      const results: JobStatus[] = [];
      
      // Fetch by job IDs
      for (const jobId of trackedJobs) {
        try {
          const response = await fetch(`/api/generate?jobId=${jobId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              results.push(data.data);
            }
          }
        } catch (error) {
          console.error(`Error fetching job ${jobId}:`, error);
        }
      }
      
      // Fetch by mockup IDs
      for (const mockupId of trackedMockups) {
        try {
          const response = await fetch(`/api/generate?mockupId=${mockupId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              results.push(data.data);
            }
          }
        } catch (error) {
          console.error(`Error fetching mockup ${mockupId}:`, error);
        }
      }
      
      return results;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: trackedJobs.length > 0 || trackedMockups.length > 0
  });

  // Handle job status changes and notifications
  useEffect(() => {
    if (!jobStatuses) return;

    const now = Date.now();
    let newlyCompleted = 0;
    let hasErrors = false;

    jobStatuses.forEach((status) => {
      const jobId = status.job._id;
      const wasCompleted = completedJobs.has(jobId);

      if (!wasCompleted && (status.job.status === 'completed' || status.job.status === 'failed')) {
        setCompletedJobs(prev => new Set(prev).add(jobId));
        newlyCompleted++;

        if (status.job.status === 'completed') {
          onJobComplete?.(jobId, status.mockup);
        }

        if (status.job.status === 'failed') {
          hasErrors = true;
        }
      }
    });

    // Show notifications for status changes (throttled)
    if (now - lastNotificationTime > 10000) { // Max one notification per 10 seconds
      if (newlyCompleted > 0) {
        if (hasErrors) {
          showNotification(
            `${newlyCompleted} job(s) completed with some errors`,
            "warning"
          );
        } else {
          showNotification(
            `${newlyCompleted} mockup(s) generated successfully!`,
            "success"
          );
        }
        setLastNotificationTime(now);
      }
    }

    // Check if all jobs are complete
    const allComplete = jobStatuses.every(status => 
      status.job.status === 'completed' || status.job.status === 'failed' || status.job.status === 'cancelled'
    );
    
    if (allComplete && jobStatuses.length > 0) {
      onAllComplete?.();
    }
  }, [jobStatuses, completedJobs, onJobComplete, onAllComplete, showNotification, lastNotificationTime]);

  const addJobsToTrack = (newJobIds: string[]) => {
    setTrackedJobs(prev => [...new Set([...prev, ...newJobIds])]);
  };

  const addMockupsToTrack = (newMockupIds: string[]) => {
    setTrackedMockups(prev => [...new Set([...prev, ...newMockupIds])]);
  };

  const removeJobFromTrack = (jobId: string) => {
    setTrackedJobs(prev => prev.filter(id => id !== jobId));
    setCompletedJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  };

  const getJobProgress = (job: GenerationJob): number => {
    switch (job.status) {
      case 'queued': return 0;
      case 'processing': return 50; // Could be more sophisticated based on logs
      case 'completed': return 100;
      case 'failed':
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-yellow-400 bg-yellow-400/20';
      case 'processing': return 'text-blue-400 bg-blue-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getEstimatedTimeRemaining = (job: GenerationJob): string => {
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return 'Completed';
    }
    
    if (job.status === 'processing' && job.startedAt) {
      const elapsed = Date.now() - job.startedAt;
      const estimated = Math.max(30000 - elapsed, 0); // Assume 30s average processing time
      return `~${Math.ceil(estimated / 1000)}s remaining`;
    }
    
    // Estimate queue time based on priority
    const queuePosition = job.priority; // Simplified estimation
    const estimatedWait = queuePosition * 30000; // 30s per job ahead
    return `~${Math.ceil(estimatedWait / 60000)}m in queue`;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (!jobStatuses || jobStatuses.length === 0) {
    return (
      <FrostedCard className="p-6">
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p>No jobs to track</p>
          <p className="text-sm mt-1">Generation jobs will appear here</p>
        </div>
      </FrostedCard>
    );
  }

  const totalJobs = jobStatuses.length;
  const completedJobsCount = jobStatuses.filter(status => 
    status.job.status === 'completed'
  ).length;
  const failedJobsCount = jobStatuses.filter(status => 
    status.job.status === 'failed'
  ).length;
  const processingJobsCount = jobStatuses.filter(status => 
    status.job.status === 'processing'
  ).length;
  const queuedJobsCount = jobStatuses.filter(status => 
    status.job.status === 'queued'
  ).length;

  const overallProgress = totalJobs > 0 ? (completedJobsCount / totalJobs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <FrostedCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
            <p className="text-gray-400 text-sm">
              {completedJobsCount} of {totalJobs} mockups generated
            </p>
          </div>
          {showControls && (
            <div className="flex space-x-3">
              <FrostedButton
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
              >
                Refresh
              </FrostedButton>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-white font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{queuedJobsCount}</div>
            <div className="text-xs text-gray-400">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{processingJobsCount}</div>
            <div className="text-xs text-gray-400">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{completedJobsCount}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{failedJobsCount}</div>
            <div className="text-xs text-gray-400">Failed</div>
          </div>
        </div>
      </FrostedCard>

      {/* Individual Job Progress */}
      <FrostedCard className="p-6">
        <h4 className="text-md font-semibold text-white mb-4">Individual Jobs</h4>
        <div className="space-y-4">
          {jobStatuses.map((status) => {
            const progress = getJobProgress(status.job);
            const statusColor = getStatusColor(status.job.status);
            const timeRemaining = getEstimatedTimeRemaining(status.job);

            return (
              <div key={status.job._id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-white truncate">
                      {status.mockup.prompt.slice(0, 60)}...
                    </h5>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {status.job.status.charAt(0).toUpperCase() + status.job.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {status.job.type} • {status.job.estimatedCredits} credits
                      </span>
                    </div>
                  </div>
                  
                  {showControls && status.job.status === 'queued' && (
                    <FrostedButton
                      size="sm"
                      variant="ghost"
                      onClick={() => removeJobFromTrack(status.job._id)}
                    >
                      Cancel
                    </FrostedButton>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-400">{timeRemaining}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        status.job.status === 'processing' ? 'bg-blue-500' :
                        status.job.status === 'completed' ? 'bg-green-500' :
                        status.job.status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-400">
                  <div>
                    <span className="block">Queued</span>
                    <span>{new Date(status.job.queuedAt).toLocaleTimeString()}</span>
                  </div>
                  {status.job.startedAt && (
                    <div>
                      <span className="block">Started</span>
                      <span>{new Date(status.job.startedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {status.job.completedAt && (
                    <div>
                      <span className="block">Completed</span>
                      <span>
                        {new Date(status.job.completedAt).toLocaleTimeString()}
                        {status.job.startedAt && (
                          <span className="ml-2 text-green-400">
                            ({formatDuration(status.job.completedAt - status.job.startedAt)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {status.job.error && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                    {status.job.error}
                  </div>
                )}

                {/* Generated Image Preview */}
                {status.job.status === 'completed' && status.mockup.generatedImageId && (
                  <div className="mt-3 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                      <img 
                        src={`/api/files/${status.mockup.generatedImageId}`}
                        alt="Generated mockup"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <FrostedButton size="sm" variant="ghost">
                        Download
                      </FrostedButton>
                      <FrostedButton size="sm" variant="ghost">
                        Share
                      </FrostedButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FrostedCard>
    </div>
  );
}

// Simplified version for embedding in other components
export function ProgressTrackerCompact({ jobIds, mockupIds }: Pick<ProgressTrackerProps, 'jobIds' | 'mockupIds'>) {
  return (
    <ProgressTracker 
      jobIds={jobIds}
      mockupIds={mockupIds}
      showControls={false}
      autoRefresh={true}
      refreshInterval={3000}
    />
  );
}