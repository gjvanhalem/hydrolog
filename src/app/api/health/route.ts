import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest
) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    logger.debug('Health check passed', health);
    return NextResponse.json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Service unavailable'
      }, 
      { status: 503 }
    );
  }
}
