import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the system details for the authenticated user
    const system = await prisma.system.findFirst({
      where: {
        users: {
          some: {
            id: user.id, // Use the authenticated user's ID
          },
        },
      },
    });    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: system.id,
      name: system.name,
      positionsPerRow: system.positionsPerRow,
    });
  } catch (error) {
    console.error('Error fetching system:', error);
    return NextResponse.json({ error: 'Failed to fetch system' }, { status: 500 });
  }
}
