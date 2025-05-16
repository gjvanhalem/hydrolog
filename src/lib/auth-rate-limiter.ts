// Simple in-memory auth rate limiter for Edge Runtime
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './logger';

// In-memory store for rate limiting (this will reset on app restart)
// In production, you might want to use Redis or another persistent store
const authRateLimitStore = new Map<string, { count: number; reset: number }>();

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_REQUESTS = 5; // Stricter limit for authentication attempts

export async function authRateLimiter(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, data] of authRateLimitStore.entries()) {
    if (data.reset <= now) {
      authRateLimitStore.delete(key);
    }
  }
  
  // Get or create rate limit data for this IP
  let rateLimit = authRateLimitStore.get(ip);
  if (!rateLimit) {
    rateLimit = {
      count: 0,
      reset: now + AUTH_WINDOW_MS
    };
    authRateLimitStore.set(ip, rateLimit);
  }
  
  // Increment request count
  rateLimit.count++;
  
  // Check if limit is exceeded
  if (rateLimit.count > AUTH_MAX_REQUESTS) {
    logger.warn(`Auth rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { message: 'Too many login attempts, please try again later' },
      { status: 429, headers: {
        'Retry-After': Math.ceil((rateLimit.reset - now) / 1000).toString(),
        'X-RateLimit-Limit': AUTH_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(rateLimit.reset / 1000).toString()
      }}
    );
  }
  
  // Continue to the API endpoint
  return null;
}