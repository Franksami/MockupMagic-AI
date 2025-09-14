import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserServerSide } from '@/lib/whop-sdk';
import { api } from '../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get('id');

    if (!storageId) {
      return new NextResponse('Storage ID is required', { status: 400 });
    }

    // Get authenticated user
    const authResult = await authenticateUserServerSide(request.headers);
    if (!authResult) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Get user data from Convex
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: authResult.whopUser.id
    });

    if (!userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    try {
      // Get file download info from Convex
      const downloadInfo = await convex.query(api.functions.files.getFileForDownload, {
        storageId: storageId as any
      });

      if (!downloadInfo || !downloadInfo.url) {
        return new NextResponse('File not found', { status: 404 });
      }

      // Fetch the file from Convex's public URL
      const fileResponse = await fetch(downloadInfo.url);

      if (!fileResponse.ok) {
        return new NextResponse('Failed to retrieve file', { status: 500 });
      }

      const fileBlob = await fileResponse.blob();

      // Determine file extension and name
      let filename = 'download.png';
      let contentType = 'image/png';

      if (downloadInfo.metadata) {
        filename = downloadInfo.metadata.filename || 'download.png';
        contentType = downloadInfo.metadata.contentType || 'image/png';

        // Ensure filename has proper extension
        if (!filename.includes('.') && contentType.startsWith('image/')) {
          const ext = contentType.split('/')[1];
          filename = `${filename}.${ext}`;
        }
      }

      // Return file with download headers
      return new NextResponse(fileBlob, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, max-age=0',
        }
      });

    } catch (convexError) {
      console.error('Convex storage error:', convexError);

      // Handle specific Convex errors
      if (convexError instanceof Error) {
        if (convexError.message.includes('not found')) {
          return new NextResponse('File not found in storage', { status: 404 });
        }
        if (convexError.message.includes('access')) {
          return new NextResponse('Access denied to file', { status: 403 });
        }
      }

      return new NextResponse('Failed to retrieve file from storage', { status: 500 });
    }

  } catch (error) {
    console.error('Download API error:', error);

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Also support POST for downloading with additional data/context
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { storageId, filename } = body;

    if (!storageId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_ID', message: 'Storage ID is required' }
      }, { status: 400 });
    }

    // Get authenticated user
    const authResult = await authenticateUserServerSide(request.headers);
    if (!authResult) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    try {
      // Get file download info from Convex
      const downloadInfo = await convex.query(api.functions.files.getFileForDownload, {
        storageId: storageId as any
      });

      if (!downloadInfo || !downloadInfo.url) {
        return NextResponse.json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: 'File not found' }
        }, { status: 404 });
      }

      // Fetch the file from Convex's public URL
      const fileResponse = await fetch(downloadInfo.url);

      if (!fileResponse.ok) {
        return NextResponse.json({
          success: false,
          error: { code: 'FETCH_ERROR', message: 'Failed to retrieve file' }
        }, { status: 500 });
      }

      const fileBlob = await fileResponse.blob();

      // Use provided filename or fallback to stored filename
      const downloadFilename = filename || downloadInfo.metadata?.filename || 'download.png';
      const contentType = downloadInfo.metadata?.contentType || 'image/png';

      // Return file with download headers
      return new NextResponse(fileBlob, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Cache-Control': 'private, max-age=0',
        }
      });

    } catch (convexError) {
      console.error('Convex storage error:', convexError);

      return NextResponse.json({
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to retrieve file from storage',
          details: convexError instanceof Error ? convexError.message : 'Unknown error'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Download POST API error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}