import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { authenticateUserServerSide } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    details?: any;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Get authenticated user first
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

    // Get user data from Convex
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    });

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided'
        }
      }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File must be JPEG, PNG, or WebP'
        }
      }, { status: 400 });
    }

    // Validate file size (max 10MB for basic tier, 25MB for growth, 50MB for pro)
    const maxFileSize = userData.limits?.maxFileSize || 10; // MB
    const maxSizeBytes = maxFileSize * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File must be smaller than ${maxFileSize}MB`
        }
      }, { status: 400 });
    }

    // Generate upload URL via Convex
    const uploadUrl = await convex.mutation(api.functions.files.generateUploadUrl);

    // Upload file to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    const uploadResult = await uploadResponse.json();
    const storageId = uploadResult.storageId;

    // Save file reference in database
    const fileRecord = await convex.mutation(api.functions.files.saveFileReference, {
      storageId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      userId: userData._id
    });

    // Create public URL for the file
    const publicUrl = `/api/files/${storageId}`;

    return NextResponse.json({
      success: true,
      data: {
        storageId,
        publicUrl,
        filename: file.name,
        contentType: file.type,
        size: file.size
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

// GET endpoint to retrieve file info
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get('id');

    if (!storageId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Storage ID is required'
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

    // Get file info from Convex
    const fileInfo = await convex.query(api.functions.files.getFileInfo, { storageId: storageId as any });

    if (!fileInfo) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: fileInfo
    });

  } catch (error) {
    console.error('File info API error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get file info'
      }
    }, { status: 500 });
  }
}