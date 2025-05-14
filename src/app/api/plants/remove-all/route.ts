import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    logger.info('Removing all plants');
    
    // Update all active plants to mark them as removed and clear their positions
    // This keeps the plant logs for historical data
    const result = await prisma.plant.updateMany({
      where: {
        status: { not: 'removed' }
      },
      data: {
        status: 'removed',
        position: null
      }
    });

    logger.info('All plants removed successfully', { count: result.count });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    logger.error('Failed to remove all plants', { error });
    return NextResponse.json(
      { error: 'Failed to remove all plants' },
      { status: 500 }
    );
  }
}
