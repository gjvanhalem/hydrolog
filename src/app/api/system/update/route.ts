import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.systemId) {
      return NextResponse.json({ error: 'User does not have an associated system' }, { status: 400 });
    }

    const { positionsPerRow } = await req.json();

    if (!Array.isArray(positionsPerRow) || positionsPerRow.some(pos => typeof pos !== 'number')) {
      return NextResponse.json({ error: 'Invalid positionsPerRow format' }, { status: 400 });
    }

    // Remove all plants associated with the user's system
    await prisma.plant.deleteMany({
      where: {
        systemId: user.systemId,
      },
    });

    // Update the system layout
    const updatedSystem = await prisma.system.update({
      where: { id: user.systemId },
      data: { positionsPerRow: positionsPerRow as Prisma.JsonValue }, // Treat as JSON value
    });

    return NextResponse.json({ success: true, system: updatedSystem });
  } catch (error) {
    console.error('Error updating system layout:', error);
    return NextResponse.json({ error: 'Failed to update system layout' }, { status: 500 });
  }
}
