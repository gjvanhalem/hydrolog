import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import jwt from 'jsonwebtoken'; // Replaced with jose
import * as jose from 'jose';
import { logger } from '@/lib/logger';
import { updateMetrics } from '@/lib/metrics';
import { rateLimiter } from '@/lib/rate-limiter';
import { AuthTokenPayload } from '@/lib/auth';

// JWT secret - In production, use an environment variable
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'your-secret-jwt-key-must-be-at-least-32-bytes-long-for-hs256';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET_STRING);

// Routes that require authentication
const protectedRoutes = [
  '/api/plants',
  '/api/system/logs',
  '/api/plants/history',
  '/api/plants/remove-all',
  '/api/upload'
];

// Routes that are excluded from authentication requirement
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/health'
];

// Routes that should redirect to home if already authenticated
const authRoutes = [
  '/login',
  '/signup'
];

// Client-side routes that need authentication - will be protected in components
// This is used for logging and monitoring in the middleware
const clientProtectedRoutes = [
  '/plants',
  '/plants/history',
  '/plants/new',
  '/system/record',
  '/system/daily',
  '/reports'
];

export async function middleware(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = await rateLimiter(request);  // Return early if rate limit is exceeded
  if (rateLimitResponse) return rateLimitResponse;

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
    // Check if route needs authentication
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path === route);
  const isAuthRoute = authRoutes.some(route => path === route);
  const isClientProtectedRoute = clientProtectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`));
    // Check if user is logged in - cookies() in request object doesn't need to be awaited
  const isLoggedIn = !!request.cookies.get('auth_token')?.value;
  
  // Log authentication info for protected routes
  if (isProtectedRoute || isClientProtectedRoute) {
    logger.debug('Auth check for protected route', { 
      path, 
      isLoggedIn,
      requestId
    });
  }
  
  // If on login/signup page and already authenticated, redirect to home
  if (isAuthRoute && isLoggedIn) {
    logger.info('Authenticated user trying to access auth routes, redirecting to home', { path });
    return NextResponse.redirect(new URL('/', request.url));
  }
  // If it's a protected route (API or client-side), verify authentication
  if ((isProtectedRoute && !isPublicRoute) || isClientProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      logger.warn('Unauthorized access attempt - No token', { path });
      
      // For API routes, return 401 Unauthorized
      if (isProtectedRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // For client routes, redirect to login page
      if (isClientProtectedRoute) {
        // Store the path for redirect after login
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', path);
        logger.info('Redirecting unauthenticated user to login', { from: path, to: url.toString() });
        return NextResponse.redirect(url);
      }
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      logger.info('Middleware: Attempting to verify token with jose', { 
        path, 
        tokenExists: !!token,
        jwtSecretLoaded: !!JWT_SECRET_STRING,
        jwtSecretSource: process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'default_fallback_key'
      });

      // Verify and decode the token using jose
      const { payload: decoded } = await jose.jwtVerify(token, JWT_SECRET_BYTES) as { payload: AuthTokenPayload };
      
      // Create new headers and set the x-user-id
      const newHeaders = new Headers(request.headers);
      newHeaders.set('x-user-id', decoded.userId.toString());
      
      // Pass the modified request to the next handler
      return NextResponse.next({
        request: {
          headers: newHeaders,
        },
      });
    } catch (error) {
      const jwtError = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      logger.error('Middleware: JWT verification failed with jose', { 
        path, 
        errorName,
        errorMessage: jwtError,
        jwtSecretLoaded: !!JWT_SECRET_STRING,
        jwtSecretSource: process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'default_fallback_key'
      });

      let response;

      if (isClientProtectedRoute) {
        // For client routes, redirect to login
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', path); // Preserve original destination
        logger.info('Redirecting user with invalid token to login', { from: path, to: url.toString() });
        response = NextResponse.redirect(url);
      } else {
        // For API routes or other cases, return 401 JSON
        response = NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });
      }
      
      // Corrected cookie deletion
      response.cookies.delete({ name: 'auth_token', path: '/' });
      return response;
    }
  }

  // Clone the headers to add our custom ones
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Log the incoming request
  logger.info('Incoming request', {
    method: request.method,
    path: request.nextUrl.pathname,
    requestId,
  });

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add response headers
  response.headers.set('x-request-id', requestId);
  
  // Update metrics after the response
  response.headers.set('Server-Timing', `total;dur=${Date.now() - startTime}`);
  updateMetrics(response.status);

  return response;
}

export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    
    // Client routes (excluding static assets)
    '/((?!_next/static|_next/image|favicon.ico|.*.svg).*)',
    
    // Specifically include the plants history page
    '/plants/history'
  ]
}
