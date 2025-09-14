import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { getGenerationStatus } from '@/lib/replicate';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Replicate webhook payload interface
interface ReplicateWebhook {
  id: string;
  version: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, any>;
  output?: string[];
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

// Verify webhook authenticity (if Replicate provides webhook secrets)
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  // Note: Replicate doesn't currently provide webhook signatures
  // This is a placeholder for future implementation
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    
    // Verify webhook authenticity
    if (!verifyWebhookSignature(request, rawBody)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const webhook: ReplicateWebhook = JSON.parse(rawBody);
    
    console.log('Received Replicate webhook:', {
      id: webhook.id,
      status: webhook.status,
      completed_at: webhook.completed_at
    });
    
    // Find the job associated with this Replicate ID
    const job = await convex.query(api.functions.mockups.getJobByReplicateId, {
      replicateId: webhook.id
    });
    
    if (!job) {
      console.error('No job found for Replicate ID:', webhook.id);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Update job status based on webhook
    await updateJobFromWebhook(job._id, webhook);
    
    // Handle different webhook statuses
    switch (webhook.status) {
      case 'starting':
        await handleJobStarting(job._id, webhook);
        break;
        
      case 'processing':
        await handleJobProcessing(job._id, webhook);
        break;
        
      case 'succeeded':
        await handleJobSucceeded(job._id, webhook);
        break;
        
      case 'failed':
        await handleJobFailed(job._id, webhook);
        break;
        
      case 'canceled':
        await handleJobCanceled(job._id, webhook);
        break;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Update job with webhook data
async function updateJobFromWebhook(jobId: string, webhook: ReplicateWebhook) {
  const updateData: any = {
    jobId,
    metadata: {
      replicateStatus: webhook.status,
      logs: webhook.logs,
      lastWebhookAt: Date.now()
    }
  };
  
  if (webhook.started_at) {
    updateData.startedAt = new Date(webhook.started_at).getTime();
  }
  
  if (webhook.completed_at) {
    updateData.completedAt = new Date(webhook.completed_at).getTime();
  }
  
  if (webhook.error) {
    updateData.error = webhook.error;
  }
  
  await convex.mutation(api.functions.mockups.updateJobStatus, updateData);
}

// Handle job starting
async function handleJobStarting(jobId: string, webhook: ReplicateWebhook) {
  console.log(`Job ${jobId} starting on Replicate`);
  
  await convex.mutation(api.functions.mockups.updateJobStatus, {
    jobId,
    status: 'processing',
    startedAt: new Date(webhook.started_at || webhook.created_at).getTime()
  });
  
  // Update corresponding mockup status
  const job = await convex.query(api.functions.mockups.getJob, { jobId });
  if (job) {
    await convex.mutation(api.functions.mockups.updateStatus, {
      mockupId: job.mockupId,
      status: 'processing'
    });
  }
}

// Handle job processing updates
async function handleJobProcessing(jobId: string, webhook: ReplicateWebhook) {
  console.log(`Job ${jobId} processing on Replicate`);
  
  // Update with any new logs
  if (webhook.logs) {
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      metadata: {
        logs: webhook.logs,
        processingUpdate: Date.now()
      }
    });
  }
}

// Handle successful job completion
async function handleJobSucceeded(jobId: string, webhook: ReplicateWebhook) {
  console.log(`Job ${jobId} succeeded on Replicate`);
  
  try {
    const job = await convex.query(api.functions.mockups.getJob, { jobId });
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Calculate actual credits used
    const processingTime = webhook.metrics?.predict_time || 0;
    const actualCredits = job.estimatedCredits; // For now, use estimated credits
    
    // Store generated images
    const imageUrls = webhook.output || [];
    let thumbnailId, generatedImageId;
    
    if (imageUrls.length > 0) {
      // Download and store the generated image
      const imageUrl = imageUrls[0];
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Store in Convex
      generatedImageId = await convex.mutation(api.functions.mockups.storeGeneratedImage, {
        mockupId: job.mockupId,
        imageBlob: await imageBlob.arrayBuffer(),
        fileName: `mockup_${job.mockupId}_${Date.now()}.png`,
        mimeType: 'image/png'
      });
      
      // Generate thumbnail
      thumbnailId = await convex.mutation(api.functions.mockups.generateThumbnail, {
        mockupId: job.mockupId,
        sourceImageId: generatedImageId
      });
    }
    
    // Update job as completed
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      status: 'completed',
      completedAt: new Date(webhook.completed_at!).getTime(),
      actualCredits,
      metadata: {
        replicateStatus: webhook.status,
        processingTime,
        output: webhook.output,
        logs: webhook.logs
      }
    });
    
    // Update mockup with generated content
    await convex.mutation(api.functions.mockups.completeGeneration, {
      mockupId: job.mockupId,
      generatedImageId,
      thumbnailId,
      generationTimeMs: processingTime * 1000,
      processingSteps: 50, // Default SDXL steps
      status: 'completed'
    });
    
    // Update user analytics
    await convex.mutation(api.functions.users.incrementStats, {
      userId: job.userId,
      type: 'mockup_generated',
      amount: 1
    });
    
    // Check if there are more jobs in queue for this user
    const nextJob = await convex.query(api.functions.mockups.getNextUserJob, {
      userId: job.userId
    });
    
    if (nextJob) {
      // Start next job in queue
      await processNextJob(nextJob._id);
    }
    
  } catch (error) {
    console.error('Error handling job success:', error);
    
    // Mark job as failed if we can't process the success
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      status: 'failed',
      error: `Failed to process success: ${error instanceof Error ? error.message : 'Unknown error'}`,
      completedAt: Date.now()
    });
  }
}

// Handle job failure
async function handleJobFailed(jobId: string, webhook: ReplicateWebhook) {
  console.log(`Job ${jobId} failed on Replicate:`, webhook.error);
  
  try {
    const job = await convex.query(api.functions.mockups.getJob, { jobId });
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Check if we should retry
    const shouldRetry = job.attempts < job.maxAttempts;
    
    if (shouldRetry) {
      // Increment retry count and requeue
      await convex.mutation(api.functions.mockups.retryJob, {
        jobId,
        error: webhook.error || 'Generation failed',
        nextRetryAt: Date.now() + (Math.pow(2, job.attempts) * 30000) // Exponential backoff
      });
      
      console.log(`Job ${jobId} queued for retry (attempt ${job.attempts + 1})`);
    } else {
      // Mark as permanently failed
      await convex.mutation(api.functions.mockups.updateJobStatus, {
        jobId,
        status: 'failed',
        error: webhook.error || 'Generation failed after max retries',
        completedAt: Date.now()
      });
      
      // Update mockup status
      await convex.mutation(api.functions.mockups.updateStatus, {
        mockupId: job.mockupId,
        status: 'failed',
        error: webhook.error || 'Generation failed'
      });
      
      // Refund credits to user
      await convex.mutation(api.functions.users.refundCredits, {
        userId: job.userId,
        amount: job.estimatedCredits,
        reason: `Generation failed: ${webhook.error || 'Unknown error'}`
      });
      
      console.log(`Job ${jobId} permanently failed, credits refunded`);
    }
    
    // Start next job if available
    const nextJob = await convex.query(api.functions.mockups.getNextUserJob, {
      userId: job.userId
    });
    
    if (nextJob && !shouldRetry) {
      await processNextJob(nextJob._id);
    }
    
  } catch (error) {
    console.error('Error handling job failure:', error);
  }
}

// Handle job cancellation
async function handleJobCanceled(jobId: string, webhook: ReplicateWebhook) {
  console.log(`Job ${jobId} canceled on Replicate`);
  
  try {
    const job = await convex.query(api.functions.mockups.getJob, { jobId });
    if (!job) {
      throw new Error('Job not found');
    }
    
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      status: 'cancelled',
      completedAt: Date.now(),
      error: 'Job was cancelled'
    });
    
    // Update mockup status
    await convex.mutation(api.functions.mockups.updateStatus, {
      mockupId: job.mockupId,
      status: 'cancelled'
    });
    
    // Refund credits
    await convex.mutation(api.functions.users.refundCredits, {
      userId: job.userId,
      amount: job.estimatedCredits,
      reason: 'Job cancelled'
    });
    
    // Start next job if available
    const nextJob = await convex.query(api.functions.mockups.getNextUserJob, {
      userId: job.userId
    });
    
    if (nextJob) {
      await processNextJob(nextJob._id);
    }
    
  } catch (error) {
    console.error('Error handling job cancellation:', error);
  }
}

// Process next job in queue
async function processNextJob(jobId: string) {
  // This would trigger the generation process for the next job
  // For now, we'll mark it as processing and let the main system handle it
  console.log(`Starting next job: ${jobId}`);
  
  // Implementation would go here to start the Replicate generation
  // This is similar to the processGenerationJob function in the main API
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'replicate-webhook'
  });
}