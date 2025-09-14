import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserServerSide } from '@/lib/whop-sdk';
import { generateMockup, type GenerationQuality } from '@/lib/replicate';
import { 
  generateMockupPrompt, 
  type ProductCategory, 
  type MockupStyle, 
  type LightingCondition,
  type Background 
} from '@/lib/prompt-engineering';
import { 
  calculateCredits, 
  validateJobRequirements,
  calculateJobPriority,
  type JobType 
} from '@/lib/queue-manager';
import { api } from '../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Request interface for generation API
interface GenerateRequest {
  // Product information
  productName?: string;
  productDescription?: string;
  productImage?: string; // Base64 or URL
  
  // Template configuration
  templateId?: string;
  category: ProductCategory;
  style: MockupStyle;
  lighting?: LightingCondition;
  background?: Background;
  
  // Generation settings
  quality: GenerationQuality;
  customPrompt?: string;
  negativePrompt?: string;
  includeHands?: boolean;
  angle?: 'front' | 'side' | 'top' | 'angled' | '3quarter';
  mood?: 'professional' | 'casual' | 'luxury' | 'modern' | 'vintage';
  
  // Batch settings
  variations?: number;
  batchSize?: number;
  
  // Project association
  projectId?: string;
  whopProductId?: string;
}

// Response interface
interface GenerateResponse {
  success: boolean;
  data?: {
    mockupIds: string[];
    jobIds: string[];
    estimatedWaitTime: number;
    creditsUsed: number;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Input validation schema
function validateGenerateRequest(body: any): { valid: boolean; errors: string[]; data?: GenerateRequest } {
  const errors: string[] = [];
  
  // Required fields
  if (!body.category) {
    errors.push('Product category is required');
  }
  
  if (!body.style) {
    errors.push('Mockup style is required');
  }
  
  if (!body.quality) {
    errors.push('Generation quality is required');
  }
  
  // Validate enum values
  const validCategories = ['digital', 'physical', 'apparel', 'books', 'courses', 'branding'];
  if (body.category && !validCategories.includes(body.category)) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }
  
  const validStyles = ['studio', 'lifestyle', 'minimal', 'dramatic', 'outdoor', 'workspace'];
  if (body.style && !validStyles.includes(body.style)) {
    errors.push(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
  }
  
  const validQualities = ['draft', 'standard', 'premium'];
  if (body.quality && !validQualities.includes(body.quality)) {
    errors.push(`Invalid quality. Must be one of: ${validQualities.join(', ')}`);
  }
  
  // Validate batch size limits
  if (body.batchSize && (body.batchSize < 1 || body.batchSize > 10)) {
    errors.push('Batch size must be between 1 and 10');
  }
  
  if (body.variations && (body.variations < 1 || body.variations > 5)) {
    errors.push('Variations must be between 1 and 5');
  }
  
  // Validate image data if provided
  if (body.productImage) {
    if (typeof body.productImage !== 'string') {
      errors.push('Product image must be a valid base64 string or URL');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? body as GenerateRequest : undefined
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    console.log('=== Generation API Request Started ===');

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }
      }, { status: 400 });
    }

    // Validate input
    const validation = validateGenerateRequest(body);
    if (!validation.valid) {
      console.log('Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.errors
        }
      }, { status: 400 });
    }

    const generateRequest = validation.data!;
    console.log('Request validated successfully');

    // Get authenticated user
    console.log('Attempting authentication...');
    let authResult;
    try {
      authResult = await authenticateUserServerSide(request.headers);
      console.log('Authentication result:', authResult ? 'SUCCESS' : 'FAILED');
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          details: authError instanceof Error ? authError.message : 'Unknown auth error'
        }
      }, { status: 401 });
    }

    if (!authResult) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Get user data from Convex
    console.log('Fetching user data from Convex for Whop ID:', authResult.whopUser.id);
    let userData;
    try {
      userData = await convex.query(api.functions.users.getByWhopId, {
        whopUserId: authResult.whopUser.id
      });
      console.log('User data fetched:', userData ? 'SUCCESS' : 'NOT_FOUND');
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch user data',
          details: convexError instanceof Error ? convexError.message : 'Unknown database error'
        }
      }, { status: 500 });
    }

    if (!userData) {
      // Try to create user if not found in development
      if (process.env.NODE_ENV === 'development' && authResult.whopUser.id === 'dev_user_123') {
        console.log('Creating dev user in Convex...');
        try {
          const newUserId = await convex.mutation(api.functions.users.createUser, {
            whopUserId: authResult.whopUser.id,
            email: authResult.whopUser.email,
            name: authResult.whopUser.name,
            subscriptionTier: 'pro'
          });
          console.log('Dev user created with ID:', newUserId);

          // Re-fetch the user data
          userData = await convex.query(api.functions.users.getByWhopId, {
            whopUserId: authResult.whopUser.id
          });
        } catch (createError) {
          console.error('Failed to create dev user:', createError);
          return NextResponse.json({
            success: false,
            error: {
              code: 'USER_CREATION_FAILED',
              message: 'Failed to create user account',
              details: createError instanceof Error ? createError.message : 'Unknown creation error'
            }
          }, { status: 500 });
        }
      }

      if (!userData) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found in database'
          }
        }, { status: 404 });
      }
    }
    
    // Calculate credits needed
    const batchSize = generateRequest.batchSize || 1;
    const variations = generateRequest.variations || 1;
    const totalJobs = batchSize * variations;
    const creditsPerJob = calculateCredits('generation', generateRequest.quality);
    const totalCredits = creditsPerJob * totalJobs;
    
    // Get user's current concurrent jobs
    const userJobs = await convex.query(api.functions.mockups.getUserActiveJobs, {
      userId: userData._id
    });
    
    // Validate job requirements
    const validation_result = validateJobRequirements(
      userData.creditsRemaining,
      totalCredits,
      userData.subscriptionTier,
      userJobs.length
    );
    
    if (!validation_result.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_VALIDATION_FAILED',
          message: validation_result.errors.join(', '),
          details: {
            creditsNeeded: totalCredits,
            creditsAvailable: userData.creditsRemaining,
            concurrentJobs: userJobs.length
          }
        }
      }, { status: 400 });
    }
    
    // Generate enhanced prompts
    const promptResult = generateMockupPrompt({
      productName: generateRequest.productName,
      productDescription: generateRequest.productDescription,
      category: generateRequest.category,
      style: generateRequest.style,
      lighting: generateRequest.lighting,
      background: generateRequest.background,
      customPrompt: generateRequest.customPrompt,
      includeHands: generateRequest.includeHands,
      angle: generateRequest.angle,
      mood: generateRequest.mood
    });
    
    // Create mockup records and jobs
    const mockupIds: string[] = [];
    const jobIds: string[] = [];
    
    try {
      for (let batch = 0; batch < batchSize; batch++) {
        for (let variation = 0; variation < variations; variation++) {
          // Create mockup record
          const mockupId = await convex.mutation(api.functions.mockups.create, {
            userId: userData._id,
            projectId: generateRequest.projectId as any,
            whopProductId: generateRequest.whopProductId,
            mockupType: generateRequest.category,
            templateId: generateRequest.templateId as any,
            prompt: promptResult.prompt,
            enhancedPrompt: promptResult.enhancedPrompt,
            modelVersion: 'sdxl-1.0',
            settings: {
              background: generateRequest.background || 'white',
              lighting: generateRequest.lighting || 'studio',
              angle: generateRequest.angle ? parseFloat(generateRequest.angle === 'front' ? '0' : '45') : 0,
              style: generateRequest.style,
              quality: generateRequest.quality,
              resolution: {
                width: generateRequest.quality === 'premium' ? 1536 : generateRequest.quality === 'standard' ? 1024 : 512,
                height: generateRequest.quality === 'premium' ? 1536 : generateRequest.quality === 'standard' ? 1024 : 512
              },
              colorCorrection: true,
              removeBackground: false
            },
            generationTimeMs: 0,
            queueTimeMs: 0,
            processingSteps: 0,
            status: 'pending',
            retryCount: 0,
            downloads: 0,
            shares: 0,
            tags: [generateRequest.category, generateRequest.style],
            isPublic: false
          });
          
          mockupIds.push(mockupId);
          
          // Create generation job
          const priority = calculateJobPriority(
            userData.subscriptionTier,
            'generation' as JobType,
            Date.now()
          );
          
          const jobId = await convex.mutation(api.functions.mockups.createGenerationJob, {
            userId: userData._id,
            mockupId: mockupId,
            type: 'generation',
            status: 'queued',
            priority: priority,
            attempts: 0,
            maxAttempts: 3,
            queuedAt: Date.now(),
            estimatedCredits: creditsPerJob,
            metadata: {
              prompt: promptResult.enhancedPrompt,
              negativePrompt: generateRequest.negativePrompt || promptResult.negativePrompt,
              quality: generateRequest.quality,
              productImage: generateRequest.productImage,
              batchIndex: batch,
              variationIndex: variation
            }
          });
          
          jobIds.push(jobId);
        }
      }
      
      // Deduct credits from user account
      await convex.mutation(api.functions.users.deductCredits, {
        userId: userData._id,
        amount: totalCredits,
        reason: `Mockup generation: ${totalJobs} jobs`
      });
      
      // Start processing the first job if there's capacity
      if (userJobs.length === 0) {
        // Process first job immediately
        const firstJobId = jobIds[0];
        await processGenerationJob(firstJobId, generateRequest, promptResult);
      }
      
      // Calculate estimated wait time
      const queueStats = await convex.query(api.functions.mockups.getQueueStats);
      const estimatedWaitTime = queueStats.estimatedWaitTime;
      
      return NextResponse.json({
        success: true,
        data: {
          mockupIds,
          jobIds,
          estimatedWaitTime,
          creditsUsed: totalCredits,
          message: `Successfully queued ${totalJobs} mockup generation${totalJobs > 1 ? 's' : ''}`
        }
      });
      
    } catch (error) {
      // Cleanup on failure - delete created mockups
      for (const mockupId of mockupIds) {
        try {
          await convex.mutation(api.functions.mockups.deleteMockup, { id: mockupId as any });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('=== Generation API Critical Error ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Ensure we always return a structured error response
    const errorResponse: GenerateResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : String(error)
        } : undefined
      }
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Process generation job with Replicate
async function processGenerationJob(
  jobId: string,
  request: GenerateRequest,
  promptResult: { prompt: string; negativePrompt: string; enhancedPrompt: string }
) {
  try {
    // Update job status to processing
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      status: 'processing',
      startedAt: Date.now()
    });
    
    // Create webhook URL for progress updates (only for production with HTTPS)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }

    // Skip webhook in development since Replicate requires HTTPS
    const webhookUrl = appUrl.startsWith('https://') ? `${appUrl}/api/webhooks/replicate` : undefined;
    
    // Generate mockup with Replicate
    const replicateInput: any = {
      prompt: promptResult.enhancedPrompt,
      negative_prompt: promptResult.negativePrompt,
      image: request.productImage,
      quality: request.quality,
    };

    // Add webhook only if HTTPS is available
    if (webhookUrl) {
      replicateInput.webhook = webhookUrl;
      replicateInput.webhook_events_filter = ['start', 'output', 'logs', 'completed'];
    }

    const result = await generateMockup(replicateInput);
    
    // Update job with Replicate ID
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      replicateId: result.id,
      metadata: {
        replicateStatus: result.status,
        replicateUrls: result.urls
      }
    });
    
  } catch (error) {
    console.error('Job processing error:', error);
    
    // Update job status to failed
    await convex.mutation(api.functions.mockups.updateJobStatus, {
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: Date.now()
    });
  }
}

// GET endpoint for checking generation status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const mockupId = url.searchParams.get('mockupId');
    
    if (!jobId && !mockupId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Either jobId or mockupId is required'
        }
      }, { status: 400 });
    }
    
    // Get authenticated user
    const authResult = await authenticateUserServerSide(request.headers);
    if (!authResult) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }
    
    let status;
    if (jobId) {
      status = await convex.query(api.functions.mockups.getJobStatus, { jobId });
    } else {
      status = await convex.query(api.functions.mockups.getMockupStatus, { mockupId: mockupId as any });
    }
    
    if (!status) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job or mockup not found'
        }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('=== Status Check API Error ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check status',
        details: process.env.NODE_ENV === 'development' ? {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : String(error)
        } : undefined
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}