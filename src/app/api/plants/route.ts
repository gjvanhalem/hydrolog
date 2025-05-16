import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get the active system for this user
    const activeUserSystem = await getActiveUserSystem(userId);
    if (!activeUserSystem) {
      return NextResponse.json({ error: 'No active system found' }, { status: 400 });
    }
    const systemId = activeUserSystem.systemId;
    logger.info('Fetching all plants for system', { userId, systemId });
    const plants = await prisma.plant.findMany({
      where: {
        userId,
        systemId,
        status: { not: 'removed' }
      },
      orderBy: {
        position: 'asc'
      }
    });
    logger.debug('Plants fetched successfully', { count: plants.length, systemId });
    return NextResponse.json(plants);
  } catch (error) {
    logger.error('Failed to fetch plants', { error });
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, type, position } = await req.json();
    logger.info('Creating new plant', { name, type, position, userId });
    // Get the user's active system to validate position
    const activeUserSystem = await getActiveUserSystem(userId);
    if (!activeUserSystem) {
      return NextResponse.json(
        { error: 'No active system found' },
        { status: 400 }
      );
    }
    const system = activeUserSystem.system;
    const systemId = system.id;
    // Validate plant position against system layout
    const positionsPerRow = system.positionsPerRow as number[];
    const totalPositions = positionsPerRow.reduce((sum, positions) => sum + positions, 0);
    if (position <= 0 || position > totalPositions) {
      return NextResponse.json(
        { error: `Invalid position. Must be between 1 and ${totalPositions}` },
        { status: 400 }
      );
    }
    // Check if position is already occupied
    const existingPlant = await prisma.plant.findFirst({
      where: {
        systemId,
        position,
        status: { not: 'removed' }
      }
    });
    if (existingPlant) {
      return NextResponse.json(
        { error: 'Position already occupied by another plant' },
        { status: 400 }
      );
    }
    // Create the new plant
    const plant = await prisma.plant.create({
      data: {
        name,
        type,
        position,
        status: 'active',
        startDate: new Date(),
        userId,
        systemId
      }
    });
    logger.info('Plant created successfully', { plantId: plant.id, systemId });
    return NextResponse.json(plant);
  } catch (error) {
    logger.error('Failed to create plant', { error });
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
