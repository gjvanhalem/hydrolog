import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth-with-systems';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For now, allow any authenticated user to access the admin dashboard
    // In production, you would want to check for an admin role

    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw`SELECT version();`;
    const version = Array.isArray(versionResult) && versionResult.length > 0
      ? versionResult[0].version
      : 'Unknown';
    
    // Get active connections
    const connectionsResult = await prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity;`;
    const connections = Array.isArray(connectionsResult) && connectionsResult.length > 0
      ? parseInt(connectionsResult[0].count)
      : 0;
    
    // Get database size
    const sizeResult = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `;
    const size = Array.isArray(sizeResult) && sizeResult.length > 0
      ? sizeResult[0].size
      : 'Unknown';
    
    // Get database uptime
    const uptimeResult = await prisma.$queryRaw`
      SELECT pg_postmaster_start_time()::text as start_time;
    `;
    const startTime = Array.isArray(uptimeResult) && uptimeResult.length > 0
      ? new Date(uptimeResult[0].start_time)
      : new Date();
    
    const now = new Date();
    const uptimeMillis = now.getTime() - startTime.getTime();
    const uptimeDays = Math.floor(uptimeMillis / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptimeMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const uptime = `${uptimeDays}d ${uptimeHours}h`;

    return NextResponse.json({
      version: version.split(' ')[0],
      connections,
      size,
      uptime
    });
  } catch (error) {
    logger.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
