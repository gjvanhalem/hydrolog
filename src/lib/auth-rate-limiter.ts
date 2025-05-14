import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './logger';

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function authRateLimiter(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  
  try {
    await new Promise((resolve, reject) => {
      authLimiter(
        { ip } as any,
        {
          status: (code: number) => ({ statusCode: code }),
          setHeader: () => {},
          end: (message: string) => reject(new Error(message)),
        } as any,
        (error: Error) => {
          if (error) reject(error);
          else resolve(true);
        }
      );
    });
    
    return null; // No rate limit exceeded
  } catch (error) {
    logger.warn('Auth rate limit exceeded', { ip });
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }
}
