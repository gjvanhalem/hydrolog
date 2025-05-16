import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      logger.warn('Unauthorized access attempt to plant history', { 
        path: '/api/plants/history', 
        timestamp: new Date().toISOString() 
      });
      return NextResponse.json(
        { error: 'Authentication required to access plant history' }, 
        { status: 401 }
      );
    }
      // Get the active system for this user
    const activeUserSystem = await getActiveUserSystem(userId);
    const systemId = activeUserSystem?.systemId;
    
    logger.info('Fetching plant history for user', { userId, systemId });
    
    const plants = await prisma.plant.findMany({
      where: {
        userId,
        status: 'removed',
        ...(systemId ? { systemId } : {})
      },
      include: {
        logs: {
          orderBy: {
            logDate: 'desc'
          },
          select: {
            id: true,
            status: true,
            note: true,
            photo: true,
            logDate: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
      logger.debug('Plant history fetched successfully', { 
      count: plants.length,
      timestamp: new Date().toISOString()
    });
    
    // Set proper cache control headers to prevent caching
    return NextResponse.json(plants, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Failed to fetch plant history', { 
      error, 
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Failed to fetch plant history' },
      { status: 500 }
    );
  }
}
