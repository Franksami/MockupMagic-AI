import { validateToken, hasAccess } from '@whop-apps/sdk';

export interface AuthResult {
  whopUser: {
    id: string;
    email: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  convexUser: {
    _id: string;
    whopUserId: string;
    email: string;
    name: string;
    subscriptionTier: string;
    creditsRemaining: number;
    onboardingCompleted: boolean;
  };
}

// Client-side authentication function
export async function authenticateUser(): Promise<AuthResult | null> {
  try {
    // Get token from localStorage
    const token = getTokenFromStorage();
    
    if (!token) {
      return null;
    }

    // Create headers object for Whop SDK
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    // Validate the token with Whop
    const { userId } = await validateToken({ headers });
    
    if (!userId) {
      return null;
    }

    // Check if user has access to the app
    const userHasAccess = await hasAccess({
      to: 'app:access',
      headers,
    });
    
    if (!userHasAccess) {
      throw new Error('User does not have access to this application');
    }

    // Fetch user data from your API
    const response = await fetch('/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Server-side authentication function
export async function authenticateUserServerSide(headers: Headers): Promise<AuthResult | null> {
  try {
    const authHeader = headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Create headers object for Whop SDK
    const whopHeaders = new Headers();
    whopHeaders.set('Authorization', `Bearer ${token}`);

    // Validate the token with Whop
    const { userId } = await validateToken({ headers: whopHeaders });
    
    if (!userId) {
      return null;
    }

    // Check if user has access to the app
    const userHasAccess = await hasAccess({
      to: 'app:access',
      headers: whopHeaders,
    });
    
    if (!userHasAccess) {
      return null;
    }

    // For server-side, we'll return a basic structure
    // The API routes will fetch the full user data from Convex
    return {
      whopUser: {
        id: userId,
        email: '',
        name: '',
        username: '',
      },
      convexUser: {
        _id: '',
        whopUserId: userId,
        email: '',
        name: '',
        subscriptionTier: 'starter',
        creditsRemaining: 0,
        onboardingCompleted: false,
      },
    };
  } catch (error) {
    console.error('Server-side authentication error:', error);
    return null;
  }
}

// Helper function to get token from storage
function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('whop_token');
}

// Helper function to set token in storage
export function setTokenInStorage(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('whop_token', token);
}

// Helper function to clear token from storage
export function clearTokenFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('whop_token');
}
