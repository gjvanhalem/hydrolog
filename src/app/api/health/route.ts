import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest
) {
  try {
    // Check database connection
    const startTime = performance.now();
    const dbResult = await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Math.round(performance.now() - startTime);
    
    // Get PostgreSQL-specific health metrics
    let dbInfo = {};
    try {      // PostgreSQL-specific health metrics
      const dbStats = await prisma.$queryRaw<any[]>`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          pg_database_size(current_database()) as database_size_bytes,
          current_setting('server_version') as version,
          (SELECT pg_postmaster_start_time()) as start_time
      `;
      dbInfo = dbStats[0];
    } catch (e) {
      logger.warn('Failed to get database statistics', e);
      // Continue with basic health check even if these extra metrics fail
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`,
        type: 'PostgreSQL',
        ...dbInfo
      }
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
