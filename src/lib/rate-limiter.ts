// Simple in-memory rate limiter for Edge Runtime
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './logger';

// In-memory store for rate limiting (this will reset on app restart)
// In production, you might want to use Redis or another persistent store
const rateLimitStore = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 500; // Default limit increased from 100 to 500 requests per windowMs

// Rate limit configuration for specific routes
const ROUTE_LIMITS: Record<string, number> = {
  '/api/external/plants': 1000, // Higher limit for plant API
  '/api/plants': 1000,          // Higher limit for plants API
  '/api/system': 1000           // Higher limit for system API
};

export async function rateLimiter(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const now = Date.now();
  
  // Determine the appropriate rate limit for this route
  const path = request.nextUrl.pathname;
  const maxRequests = ROUTE_LIMITS[path] || DEFAULT_MAX_REQUESTS;
  
  // Clean up expired entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.reset <= now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create rate limit data for this IP
  let rateLimit = rateLimitStore.get(ip);
  if (!rateLimit) {
    rateLimit = {
      count: 0,
      reset: now + WINDOW_MS
    };
    rateLimitStore.set(ip, rateLimit);
  }
  
  // Increment request count
  rateLimit.count++;
  
  // Check if limit is exceeded
  if (rateLimit.count > maxRequests) {
    logger.warn(`Rate limit exceeded for IP: ${ip} on path: ${path}`);
    return NextResponse.json(
      { message: 'Too many requests from this IP, please try again later' },
      { status: 429, headers: {
        'Retry-After': Math.ceil((rateLimit.reset - now) / 1000).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(rateLimit.reset / 1000).toString()
      }}
    );
  }
  
  // Continue to the API endpoint
  return null;
}