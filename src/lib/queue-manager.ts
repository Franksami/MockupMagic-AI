import { ConvexError } from "convex/values";
import type { Id } from "../../convex/_generated/dataModel";
import type { GenerationQuality } from "./replicate";

// Job status types matching Convex schema
export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type JobType = "generation" | "variation" | "upscale";

// Priority levels for job queue
export const JOB_PRIORITY = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 15,
  PREMIUM: 20
} as const;

export type JobPriority = typeof JOB_PRIORITY[keyof typeof JOB_PRIORITY];

// Credit costs by generation quality and type
export const CREDIT_COSTS = {
  generation: {
    draft: 1,
    standard: 2, 
    premium: 4
  },
  variation: {
    draft: 1,
    standard: 1,
    premium: 2
  },
  upscale: {
    draft: 2,
    standard: 3,
    premium: 5
  }
} as const;

// Queue configuration
export const QUEUE_CONFIG = {
  MAX_CONCURRENT_JOBS: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 5000, // 5 seconds base delay
  RETRY_DELAY_MAX: 300000, // 5 minutes max delay
  JOB_TIMEOUT: 600000, // 10 minutes
  CLEANUP_INTERVAL: 300000, // 5 minutes
  PRIORITY_BOOST_AFTER: 300000, // Boost priority after 5 minutes
} as const;

// Interface for creating new generation job
export interface CreateGenerationJobInput {
  userId: Id<"users">;
  mockupId: Id<"mockups">;
  type: JobType;
  priority?: JobPriority;
  estimatedCredits: number;
  metadata?: Record<string, any>;
}

// Interface for job update
export interface JobUpdate {
  status?: JobStatus;
  replicateId?: string;
  error?: string;
  errorStack?: string;
  actualCredits?: number;
  startedAt?: number;
  completedAt?: number;
  metadata?: Record<string, any>;
}

// Queue statistics interface
export interface QueueStats {
  totalJobs: number;
  queuedJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  creditsUsedToday: number;
  estimatedWaitTime: number;
}

// Error types for queue management
export class QueueError extends Error {
  constructor(message: string, public code: string, public jobId?: Id<"generationJobs">) {
    super(message);
    this.name = 'QueueError';
  }
}

export class InsufficientCreditsError extends QueueError {
  constructor(required: number, available: number, jobId?: Id<"generationJobs">) {
    super(`Insufficient credits: need ${required}, have ${available}`, 'INSUFFICIENT_CREDITS', jobId);
  }
}

export class QueueFullError extends QueueError {
  constructor(jobId?: Id<"generationJobs">) {
    super('Queue is at maximum capacity', 'QUEUE_FULL', jobId);
  }
}

// Calculate priority based on user tier and wait time
export function calculateJobPriority(
  userTier: string,
  jobType: JobType,
  queuedAt: number,
  baseWaitTime: number = 0
): JobPriority {
  let priority = JOB_PRIORITY.NORMAL;
  
  // Base priority by user tier
  switch (userTier) {
    case 'starter':
      priority = JOB_PRIORITY.LOW;
      break;
    case 'growth':
      priority = JOB_PRIORITY.NORMAL;
      break;
    case 'pro':
      priority = JOB_PRIORITY.HIGH;
      break;
    case 'enterprise':
      priority = JOB_PRIORITY.PREMIUM;
      break;
  }
  
  // Boost priority for certain job types
  if (jobType === 'variation') {
    priority += 2;
  } else if (jobType === 'upscale') {
    priority += 1;
  }
  
  // Time-based priority boost
  const waitTime = Date.now() - queuedAt - baseWaitTime;
  if (waitTime > QUEUE_CONFIG.PRIORITY_BOOST_AFTER) {
    const boostMinutes = Math.floor(waitTime / QUEUE_CONFIG.PRIORITY_BOOST_AFTER);
    priority += Math.min(boostMinutes, 5); // Max 5 point boost
  }
  
  return Math.min(priority, JOB_PRIORITY.PREMIUM) as JobPriority;
}

// Calculate estimated credits for a job
export function calculateCredits(
  type: JobType,
  quality: GenerationQuality,
  quantity: number = 1
): number {
  const baseCost = CREDIT_COSTS[type][quality];
  return baseCost * quantity;
}

// Calculate retry delay with exponential backoff
export function calculateRetryDelay(attemptNumber: number): number {
  const delay = QUEUE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, QUEUE_CONFIG.RETRY_DELAY_MAX);
}

// Estimate wait time based on queue position and processing rate
export function estimateWaitTime(
  queuePosition: number,
  averageProcessingTime: number,
  concurrentJobs: number = QUEUE_CONFIG.MAX_CONCURRENT_JOBS
): number {
  if (queuePosition <= 0) return 0;
  
  // Calculate how many jobs are ahead considering concurrent processing
  const jobsAhead = Math.ceil(queuePosition / concurrentJobs);
  return jobsAhead * averageProcessingTime;
}

// Validate job requirements before queuing
export function validateJobRequirements(
  userCredits: number,
  estimatedCredits: number,
  userTier: string,
  concurrentJobs: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check credits
  if (userCredits < estimatedCredits) {
    errors.push(`Insufficient credits: need ${estimatedCredits}, have ${userCredits}`);
  }
  
  // Check concurrent job limits
  const maxConcurrent = getUserMaxConcurrentJobs(userTier);
  if (concurrentJobs >= maxConcurrent) {
    errors.push(`Maximum concurrent jobs reached: ${maxConcurrent} for ${userTier} tier`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Get maximum concurrent jobs allowed for user tier
export function getUserMaxConcurrentJobs(userTier: string): number {
  switch (userTier) {
    case 'starter': return 1;
    case 'growth': return 3;
    case 'pro': return 5;
    case 'enterprise': return 10;
    default: return 1;
  }
}

// Calculate queue statistics
export function calculateQueueStats(
  jobs: Array<{
    status: JobStatus;
    queuedAt: number;
    startedAt?: number;
    completedAt?: number;
    actualCredits?: number;
  }>
): QueueStats {
  const totalJobs = jobs.length;
  const queuedJobs = jobs.filter(j => j.status === 'queued').length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  
  // Calculate average times
  const completedJobsWithTimes = jobs.filter(j => 
    j.status === 'completed' && j.startedAt && j.completedAt && j.queuedAt
  );
  
  const waitTimes = completedJobsWithTimes.map(j => 
    (j.startedAt! - j.queuedAt)
  );
  const processingTimes = completedJobsWithTimes.map(j => 
    (j.completedAt! - j.startedAt!)
  );
  
  const averageWaitTime = waitTimes.length > 0 
    ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
    : 0;
    
  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    : 30000; // Default 30 seconds if no data
  
  // Calculate credits used today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const creditsUsedToday = jobs
    .filter(j => j.completedAt && j.completedAt >= todayTimestamp)
    .reduce((sum, j) => sum + (j.actualCredits || 0), 0);
  
  // Estimate wait time for new job
  const estimatedWaitTime = estimateWaitTime(
    queuedJobs + 1,
    averageProcessingTime,
    QUEUE_CONFIG.MAX_CONCURRENT_JOBS - processingJobs
  );
  
  return {
    totalJobs,
    queuedJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    averageWaitTime,
    averageProcessingTime,
    creditsUsedToday,
    estimatedWaitTime
  };
}

// Job filtering and sorting utilities
export function sortJobsByPriority<T extends { priority: number; queuedAt: number }>(
  jobs: T[]
): T[] {
  return jobs.sort((a, b) => {
    // First sort by priority (higher priority first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then sort by queue time (earlier first)
    return a.queuedAt - b.queuedAt;
  });
}

export function filterJobsByStatus<T extends { status: JobStatus }>(
  jobs: T[],
  statuses: JobStatus[]
): T[] {
  return jobs.filter(job => statuses.includes(job.status));
}

export function filterJobsByUser<T extends { userId: Id<"users"> }>(
  jobs: T[],
  userId: Id<"users">
): T[] {
  return jobs.filter(job => job.userId === userId);
}

// Job health monitoring
export function identifyStaleJobs<T extends { 
  status: JobStatus; 
  startedAt?: number; 
  queuedAt: number; 
}>(jobs: T[]): T[] {
  const now = Date.now();
  return jobs.filter(job => {
    if (job.status === 'processing' && job.startedAt) {
      // Jobs processing longer than timeout
      return (now - job.startedAt) > QUEUE_CONFIG.JOB_TIMEOUT;
    }
    if (job.status === 'queued') {
      // Jobs queued longer than reasonable time (1 hour)
      return (now - job.queuedAt) > 3600000;
    }
    return false;
  });
}

// Batch operation utilities
export function createBatchJobs(
  baseJob: CreateGenerationJobInput,
  variations: Array<{ mockupId: Id<"mockups">; metadata?: Record<string, any> }>
): CreateGenerationJobInput[] {
  return variations.map(variation => ({
    ...baseJob,
    mockupId: variation.mockupId,
    metadata: { ...baseJob.metadata, ...variation.metadata }
  }));
}

export function calculateBatchCredits(
  jobs: Array<{ type: JobType; quality?: GenerationQuality; quantity?: number }>
): number {
  return jobs.reduce((total, job) => {
    const quality = job.quality || 'standard';
    const quantity = job.quantity || 1;
    return total + calculateCredits(job.type, quality, quantity);
  }, 0);
}