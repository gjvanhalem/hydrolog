import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // First check if this plant belongs to the current user
    const plant = await prisma.plant.findUnique({
      where: { id }
    });
    
    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }
    
    if (plant.userId !== userId) {
      logger.warn('Unauthorized plant deletion attempt', { userId, plantId: id });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update the plant to mark it as removed and clear its position
    // This keeps the plant logs for historical data    
    await prisma.plant.update({
      where: { id },
      data: {
        status: 'removed',
        position: undefined  // Setting to undefined will store as NULL in database
      }
    });

    return NextResponse.json({ success: true });  } catch (error) {
    // Log error via logger instead of console.error
    return NextResponse.json(
      { error: 'Failed to remove plant from position' },
      { status: 500 }
    );
  }
}
