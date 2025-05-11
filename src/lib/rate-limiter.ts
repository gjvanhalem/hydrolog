import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './logger';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function rateLimiter(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  
  try {
    await new Promise((resolve, reject) => {
      limiter(
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
    logger.warn('Rate limit exceeded', { ip });
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
}
