import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserServerSide } from '@/lib/whop-sdk';
import { api } from '../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import type { ProductCategory, MockupStyle } from '@/lib/prompt-engineering';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Template creation/update request interface
interface TemplateRequest {
  name: string;
  slug?: string;
  description?: string;
  category: ProductCategory;
  subCategory?: string;
  config: {
    mockupType: string;
    basePrompt: string;
    negativePrompt?: string;
    defaultSettings: {
      style: MockupStyle;
      lighting?: string;
      background?: string;
      quality: 'draft' | 'standard' | 'premium';
      resolution: {
        width: number;
        height: number;
      };
    };
    requiredDimensions?: {
      width: number;
      height: number;
      aspectRatio?: string;
    };
    supportedFormats: string[];
  };
  isPublic: boolean;
  isPremium: boolean;
  requiredTier: 'starter' | 'growth' | 'pro' | 'enterprise';
  tags: string[];
  searchKeywords: string[];
}

// Template response interface
interface TemplateResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Input validation
function validateTemplateRequest(body: any): { valid: boolean; errors: string[]; data?: TemplateRequest } {
  const errors: string[] = [];
  
  // Required fields
  if (!body.name) errors.push('Template name is required');
  if (!body.category) errors.push('Category is required');
  if (!body.config) errors.push('Configuration is required');
  
  // Validate config structure
  if (body.config) {
    if (!body.config.mockupType) errors.push('Mockup type is required');
    if (!body.config.basePrompt) errors.push('Base prompt is required');
    if (!body.config.defaultSettings) errors.push('Default settings are required');
    if (!body.config.supportedFormats) errors.push('Supported formats are required');
    
    if (body.config.defaultSettings) {
      if (!body.config.defaultSettings.style) errors.push('Default style is required');
      if (!body.config.defaultSettings.quality) errors.push('Default quality is required');
    }
  }
  
  // Validate enum values
  const validCategories = ['digital', 'physical', 'apparel', 'books', 'courses', 'branding'];
  if (body.category && !validCategories.includes(body.category)) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }
  
  const validStyles = ['studio', 'lifestyle', 'minimal', 'dramatic', 'outdoor', 'workspace'];
  if (body.config?.defaultSettings?.style && !validStyles.includes(body.config.defaultSettings.style)) {
    errors.push(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
  }
  
  const validTiers = ['starter', 'growth', 'pro', 'enterprise'];
  if (body.requiredTier && !validTiers.includes(body.requiredTier)) {
    errors.push(`Invalid required tier. Must be one of: ${validTiers.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? body as TemplateRequest : undefined
  };
}

// GET: List templates with filtering and pagination
export async function GET(request: NextRequest): Promise<NextResponse<TemplateResponse>> {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const subCategory = url.searchParams.get('subCategory');
    const isPublic = url.searchParams.get('public') === 'true';
    const isPremium = url.searchParams.get('premium') === 'true';
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get user for access control
    const authResult = await authenticateUserServerSide(request.headers);
    const userData = authResult ? await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    }) : null;
    
    // Build filter options (only include non-null values)
    const filters: any = {
      userTier: userData?.subscriptionTier || 'starter',
      limit,
      offset
    };

    // Only add optional filters if they have values
    if (category) filters.category = category;
    if (subCategory) filters.subCategory = subCategory;
    if (search) filters.search = search;
    if (url.searchParams.has('public')) filters.isPublic = isPublic;
    if (url.searchParams.has('premium')) filters.isPremium = isPremium;
    
    // Query templates
    const templates = await convex.query(api.functions.templates.list, filters);
    
    return NextResponse.json({
      success: true,
      data: {
        templates: templates.results,
        total: templates.total,
        hasMore: templates.hasMore
      }
    });
    
  } catch (error) {
    console.error('Template list error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch templates'
      }
    }, { status: 500 });
  }
}

// POST: Create new template
export async function POST(request: NextRequest): Promise<NextResponse<TemplateResponse>> {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateTemplateRequest(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template data',
          details: validation.errors
        }
      }, { status: 400 });
    }
    
    const templateRequest = validation.data!;
    
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
    
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    });
    
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }
    
    // Check permissions for template creation
    const canCreatePublic = ['pro', 'enterprise'].includes(userData.subscriptionTier);
    const canCreatePremium = userData.subscriptionTier === 'enterprise';
    
    if (templateRequest.isPublic && !canCreatePublic) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Pro subscription required to create public templates'
        }
      }, { status: 403 });
    }
    
    if (templateRequest.isPremium && !canCreatePremium) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Enterprise subscription required to create premium templates'
        }
      }, { status: 403 });
    }
    
    // Generate slug if not provided
    if (!templateRequest.slug) {
      templateRequest.slug = templateRequest.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }
    
    // Create template
    const templateId = await convex.mutation(api.functions.templates.create, {
      name: templateRequest.name,
      slug: templateRequest.slug,
      description: templateRequest.description,
      category: templateRequest.category,
      subCategory: templateRequest.subCategory,
      config: templateRequest.config,
      isPublic: templateRequest.isPublic,
      isPremium: templateRequest.isPremium,
      requiredTier: templateRequest.requiredTier,
      createdBy: userData._id,
      isOfficial: false, // Only admin can create official templates
      tags: templateRequest.tags,
      searchKeywords: templateRequest.searchKeywords
    });
    
    return NextResponse.json({
      success: true,
      data: {
        templateId,
        message: 'Template created successfully'
      }
    });
    
  } catch (error) {
    console.error('Template creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create template'
      }
    }, { status: 500 });
  }
}

// PUT: Update template
export async function PUT(request: NextRequest): Promise<NextResponse<TemplateResponse>> {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Template ID is required'
        }
      }, { status: 400 });
    }
    
    // Validate update data
    const validation = validateTemplateRequest(updateData);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template data',
          details: validation.errors
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
    
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    });
    
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }
    
    // Check if user owns the template or is admin
    const template = await convex.query(api.functions.templates.getById, { id });
    if (!template) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      }, { status: 404 });
    }
    
    const canEdit = template.createdBy === userData._id || userData.subscriptionTier === 'enterprise';
    if (!canEdit) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only edit your own templates'
        }
      }, { status: 403 });
    }
    
    // Update template
    await convex.mutation(api.functions.templates.update, {
      id,
      ...validation.data!
    });
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Template updated successfully'
      }
    });
    
  } catch (error) {
    console.error('Template update error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update template'
      }
    }, { status: 500 });
  }
}

// DELETE: Delete template
export async function DELETE(request: NextRequest): Promise<NextResponse<TemplateResponse>> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Template ID is required'
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
    
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    });
    
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }
    
    // Check if user owns the template
    const template = await convex.query(api.functions.templates.getById, { id });
    if (!template) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      }, { status: 404 });
    }
    
    const canDelete = template.createdBy === userData._id || userData.subscriptionTier === 'enterprise';
    if (!canDelete) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only delete your own templates'
        }
      }, { status: 403 });
    }
    
    // Delete template
    await convex.mutation(api.functions.templates.deleteTemplate, { id });
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Template deleted successfully'
      }
    });
    
  } catch (error) {
    console.error('Template deletion error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete template'
      }
    }, { status: 500 });
  }
}