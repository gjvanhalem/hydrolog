import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { updateMetrics } from '@/app/api/metrics/route';
import { rateLimiter } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = await rateLimiter(request);  // Return early if rate limit is exceeded
  if (rateLimitResponse) return rateLimitResponse;

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

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
  matcher: '/api/:path*',
}
