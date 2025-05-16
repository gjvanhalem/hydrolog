import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has any active systems
    if (!user.systems || user.systems.length === 0) {
      return NextResponse.json({ error: 'User does not have any associated systems' }, { status: 400 });
    }

    // Get the active system (assuming we want to update the first active system)
    const activeSystem = user.systems.find(userSystem => userSystem.isActive);
    
    if (!activeSystem) {
      return NextResponse.json({ error: 'User does not have an active system' }, { status: 400 });
    }

    const systemId = activeSystem.systemId;
    const { positionsPerRow } = await req.json();

    if (!Array.isArray(positionsPerRow) || positionsPerRow.some(pos => typeof pos !== 'number')) {
      return NextResponse.json({ error: 'Invalid positionsPerRow format' }, { status: 400 });
    }    // Remove all plants associated with the user's active system
    await prisma.plant.deleteMany({
      where: {
        systemId: systemId,
      },
    });

    // Update the system layout
    const updatedSystem = await prisma.system.update({
      where: { id: systemId },
      data: { positionsPerRow: positionsPerRow as Prisma.InputJsonValue }, // Treat as InputJsonValue
    });

    return NextResponse.json({ success: true, system: updatedSystem });
  } catch (error) {
    console.error('Error updating system layout:', error);
    return NextResponse.json({ error: 'Failed to update system layout' }, { status: 500 });
  }
}
