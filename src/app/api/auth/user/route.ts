import { NextRequest, NextResponse } from 'next/server';
import { validateToken, hasAccess } from '@whop-apps/sdk';
import { api } from '../../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create headers object for Whop SDK
    const whopHeaders = new Headers();
    whopHeaders.set('Authorization', `Bearer ${token}`);

    // Validate the token with Whop
    const { userId } = await validateToken({ headers: whopHeaders });
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has access to the app
    const userHasAccess = await hasAccess({
      to: 'app:access',
      headers: whopHeaders,
    });
    
    if (!userHasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user data from Convex
    let userData;
    try {
      userData = await convex.query(api.functions.users.getByWhopId, {
        whopUserId: userId
      });
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!userData) {
      // Create user if not found
      try {
        const newUserId = await convex.mutation(api.functions.users.create, {
          whopUserId: userId,
          email: '', // Will be filled from Whop API
          name: '', // Will be filled from Whop API
        });
        
        // Fetch the newly created user
        userData = await convex.query(api.functions.users.getById, {
          userId: newUserId
        });
      } catch (createError) {
        console.error('User creation error:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Type guard to ensure userData is not null
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch additional user info from Whop API if needed
    const whopUser = {
      id: userId,
      email: userData.email,
      name: userData.name || '',
      username: '', // Not stored in our schema
      profilePicture: userData.avatarUrl,
    };

    const convexUser = {
      _id: userData._id,
      whopUserId: userData.whopUserId,
      email: userData.email,
      name: userData.name || '',
      subscriptionTier: userData.subscriptionTier,
      creditsRemaining: userData.creditsRemaining,
      onboardingCompleted: userData.onboardingCompleted,
    };

    return NextResponse.json({
      whopUser,
      convexUser,
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
