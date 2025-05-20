import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Parse the request body to get the systemId
    const { systemId } = await req.json();
    
    if (!systemId) {
      logger.error('Missing systemId when removing plants');
      return NextResponse.json(
        { error: 'System ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Removing all plants for system', { systemId });
    
    // Update all active plants in the specified system to mark them as removed and clear their positions
    // This keeps the plant logs for historical data
    const result = await prisma.plant.updateMany({
      where: {
        status: { not: 'removed' },
        systemId: systemId
      },
      data: {
        status: 'removed',
        position: null
      }    });

    logger.info('Plants removed successfully from system', { systemId, count: result.count });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    logger.error('Failed to remove plants from system', { error });
    return NextResponse.json(
      { error: 'Failed to remove plants from system' },
      { status: 500 }
    );
  }
}
