import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';
import { logger } from '@/lib/logger';
import { toNumber } from '@/lib/decimal-utils';

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
    });    logger.debug('Plant history fetched successfully', { 
      count: plants.length,
      timestamp: new Date().toISOString()
    });
    
    // Convert any Decimal values to plain JavaScript numbers
    // Use a more type-safe approach
    const safeData = plants.map((plant: any) => {
      const result = { ...plant };
      
      // Function to safely convert potential Decimal fields
      const convertField = (fieldName: string) => {
        if (fieldName in plant && plant[fieldName] !== null && plant[fieldName] !== undefined) {
          result[fieldName] = toNumber(plant[fieldName]);
        }
      };
      
      // Convert all potential Decimal fields
      ['ph_min', 'ph_max', 'ec_min', 'ec_max', 'ppm_min', 'ppm_max', 'external_id'].forEach(convertField);
      
      return result;
    });
    
    // Set proper cache control headers to prevent caching
    return NextResponse.json(safeData, {
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
