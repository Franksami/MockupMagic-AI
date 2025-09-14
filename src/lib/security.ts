/**
 * Security Utilities and Hardening Functions
 * Provides input sanitization, rate limiting, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = getClientIP(request);
    const now = Date.now();
    const windowMs = config.windowMs;
    const maxRequests = config.maxRequests;

    // Clean up expired entries
    cleanupExpiredEntries(now);

    // Get or create rate limit entry
    const key = `rate_limit_${ip}`;
    let entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          details: 'Rate limit exceeded. Please try again later.',
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    entry.count++;
    rateLimitMap.set(key, entry);

    return null; // Allow request to continue
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }

  return 'unknown';
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number) {
  const expiredKeys: string[] = [];

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    rateLimitMap.delete(key);
  }
}

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize string input to prevent XSS
   */
  string(input: unknown): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>\"'&]/g, (match) => {
        const map: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return map[match] || match;
      })
      .trim()
      .slice(0, 1000); // Limit length
  },

  /**
   * Sanitize email input
   */
  email(input: unknown): string {
    if (typeof input !== 'string') {
      return '';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = input.trim().toLowerCase();

    return emailRegex.test(cleaned) ? cleaned : '';
  },

  /**
   * Sanitize numeric input
   */
  number(input: unknown, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
    const num = Number(input);
    if (isNaN(num)) {
      return 0;
    }
    return Math.max(min, Math.min(max, num));
  },

  /**
   * Sanitize boolean input
   */
  boolean(input: unknown): boolean {
    if (typeof input === 'boolean') {
      return input;
    }
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true';
    }
    return false;
  },

  /**
   * Sanitize object input by recursively sanitizing properties
   */
  object<T extends Record<string, any>>(input: unknown, schema: Record<keyof T, 'string' | 'number' | 'boolean'>): Partial<T> {
    if (!input || typeof input !== 'object') {
      return {};
    }

    const result: Partial<T> = {};
    const obj = input as Record<string, unknown>;

    for (const [key, type] of Object.entries(schema)) {
      if (key in obj) {
        switch (type) {
          case 'string':
            result[key as keyof T] = this.string(obj[key]) as T[keyof T];
            break;
          case 'number':
            result[key as keyof T] = this.number(obj[key]) as T[keyof T];
            break;
          case 'boolean':
            result[key as keyof T] = this.boolean(obj[key]) as T[keyof T];
            break;
        }
      }
    }

    return result;
  },
};

/**
 * Validation utilities
 */
export const validate = {
  /**
   * Validate required environment variables
   */
  envVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  },

  /**
   * Validate file upload
   */
  fileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate Whop user token
   */
  whopToken(token: unknown): { valid: boolean; error?: string } {
    if (typeof token !== 'string') {
      return { valid: false, error: 'Token must be a string' };
    }

    if (token.length < 10) {
      return { valid: false, error: 'Token too short' };
    }

    // Basic format validation (adjust based on actual Whop token format)
    if (!token.startsWith('user_')) {
      return { valid: false, error: 'Invalid token format' };
    }

    return { valid: true };
  },
};

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.convex.cloud https://api.whop.com; " +
    "frame-ancestors 'self' https://*.whop.com;"
  );

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

/**
 * CSRF protection for state-changing operations
 */
export function csrfProtection() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const method = request.method;

    // Only protect state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return null;
    }

    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Check origin and referer
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // Allow HTTP in development
      'https://whop.com',
      'https://app.whop.com',
    ];

    const hasValidOrigin = origin && allowedOrigins.includes(origin);
    const hasValidReferer = referer && allowedOrigins.some(allowed =>
      referer.startsWith(allowed)
    );

    if (!hasValidOrigin && !hasValidReferer) {
      return NextResponse.json(
        {
          error: 'CSRF protection failed',
          details: 'Invalid origin or referer',
        },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  };
}

/**
 * Authentication middleware
 */
export function requireAuth() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Check for Whop token in headers
      const whopToken = request.headers.get('x-whop-user-token') ||
                       request.headers.get('authorization')?.replace('Bearer ', '');

      if (!whopToken) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            details: 'Missing authentication token',
          },
          { status: 401 }
        );
      }

      // Validate token format
      const tokenValidation = validate.whopToken(whopToken);
      if (!tokenValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid authentication token',
            details: tokenValidation.error,
          },
          { status: 401 }
        );
      }

      return null; // Allow request to continue
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: 'Token validation error',
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>>) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result; // Stop on first non-null result
      }
    }
    return null;
  };
}

/**
 * Security middleware factory for API routes
 */
export function createSecureApiHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig;
    requireAuth?: boolean;
    requireCSRF?: boolean;
  } = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>> = [];

    // Add rate limiting
    if (options.rateLimit) {
      middlewares.push(rateLimit(options.rateLimit));
    }

    // Add CSRF protection
    if (options.requireCSRF) {
      middlewares.push(csrfProtection());
    }

    // Add authentication
    if (options.requireAuth) {
      middlewares.push(requireAuth());
    }

    // Run middleware pipeline
    const middlewareResult = await combineMiddleware(...middlewares)(request);
    if (middlewareResult) {
      return addSecurityHeaders(middlewareResult);
    }

    // Run the actual handler
    try {
      const response = await handler(request, ...args);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('[SECURITY] Handler error:', error);
      const errorResponse = NextResponse.json(
        {
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ?
            (error as Error).message : 'An unexpected error occurred',
        },
        { status: 500 }
      );
      return addSecurityHeaders(errorResponse);
    }
  };
}

/**
 * Security configuration validation
 */
export function validateSecurityConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check environment variables
  const envValidation = validate.envVars([
    'NEXT_PUBLIC_CONVEX_URL',
    'NEXT_PUBLIC_WHOP_APP_ID',
    'WHOP_API_KEY',
  ]);

  if (!envValidation.valid) {
    issues.push(`Missing required environment variables: ${envValidation.missing.join(', ')}`);
  }

  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    const devPatterns = [
      'test',
      'dev',
      'localhost',
      'example.com',
      'placeholder',
      'your_',
    ];

    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value === 'string') {
        for (const pattern of devPatterns) {
          if (value.toLowerCase().includes(pattern)) {
            issues.push(`Production environment contains development value: ${key}`);
            break;
          }
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Content validation for user inputs
 */
export const validateContent = {
  /**
   * Validate template selection
   */
  templateId(id: unknown): { valid: boolean; error?: string } {
    if (typeof id !== 'string') {
      return { valid: false, error: 'Template ID must be a string' };
    }

    // Basic format validation
    if (!/^template-\w+$/.test(id)) {
      return { valid: false, error: 'Invalid template ID format' };
    }

    return { valid: true };
  },

  /**
   * Validate file upload parameters
   */
  uploadParams(params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.fileName || typeof params.fileName !== 'string') {
      errors.push('Valid file name required');
    }

    if (!params.fileSize || typeof params.fileSize !== 'number') {
      errors.push('Valid file size required');
    }

    if (!params.mimeType || typeof params.mimeType !== 'string') {
      errors.push('Valid MIME type required');
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (params.mimeType && !allowedTypes.includes(params.mimeType)) {
      errors.push('File type not allowed');
    }

    // Validate file size (10MB limit)
    if (params.fileSize && params.fileSize > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate user preferences
   */
  userPreferences(prefs: any): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = [];
    const sanitized: any = {};

    if (prefs.defaultStyle !== undefined) {
      sanitized.defaultStyle = sanitize.string(prefs.defaultStyle);
    }

    if (prefs.autoSaveEnabled !== undefined) {
      sanitized.autoSaveEnabled = sanitize.boolean(prefs.autoSaveEnabled);
    }

    if (prefs.emailNotifications !== undefined) {
      sanitized.emailNotifications = sanitize.boolean(prefs.emailNotifications);
    }

    if (prefs.webhookUrl !== undefined) {
      const url = sanitize.string(prefs.webhookUrl);
      try {
        if (url) {
          new URL(url); // Validate URL format
          sanitized.webhookUrl = url;
        }
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors,
    };
  },
};

/**
 * Security audit utilities
 */
export const securityAudit = {
  /**
   * Check for common security vulnerabilities
   */
  checkVulnerabilities(): { secure: boolean; vulnerabilities: string[] } {
    const vulnerabilities: string[] = [];

    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL?.includes('https://')) {
      vulnerabilities.push('HTTPS not enforced in production');
    }

    // Check for weak secrets
    const secrets = [
      process.env.WHOP_API_KEY,
      process.env.WHOP_WEBHOOK_SECRET,
      process.env.CONVEX_DEPLOY_KEY,
    ];

    for (const secret of secrets) {
      if (secret && secret.length < 32) {
        vulnerabilities.push('Weak secret detected (less than 32 characters)');
      }
    }

    // Check CORS configuration
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    if (corsOrigins.includes('*')) {
      vulnerabilities.push('Wildcard CORS origin detected');
    }

    return {
      secure: vulnerabilities.length === 0,
      vulnerabilities,
    };
  },

  /**
   * Generate security report
   */
  generateReport(): {
    timestamp: string;
    environment: string;
    configValid: boolean;
    configIssues: string[];
    vulnerabilities: string[];
    recommendations: string[];
  } {
    const configValidation = validateSecurityConfig();
    const vulnerabilityCheck = this.checkVulnerabilities();

    const recommendations: string[] = [];

    if (!configValidation.valid) {
      recommendations.push('Fix environment configuration issues');
    }

    if (!vulnerabilityCheck.secure) {
      recommendations.push('Address security vulnerabilities');
    }

    if (process.env.NODE_ENV === 'development') {
      recommendations.push('Ensure security measures are enabled in production');
    }

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      configValid: configValidation.valid,
      configIssues: configValidation.issues,
      vulnerabilities: vulnerabilityCheck.vulnerabilities,
      recommendations,
    };
  },
};