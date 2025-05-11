import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }    // Update the plant to mark it as removed and clear its position
    // This keeps the plant logs for historical data    
    await prisma.plant.update({
      where: { id },
      data: {
        status: 'removed',
        position: undefined  // Setting to undefined will store as NULL in database
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing plant:', error);
    return NextResponse.json(
      { error: 'Failed to remove plant from position' },
      { status: 500 }
    );
  }
}
