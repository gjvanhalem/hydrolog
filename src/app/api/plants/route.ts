import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching all plants for user', { userId });
    const plants = await prisma.plant.findMany({
      where: {
        userId,
        status: { not: 'removed' }
      },
      orderBy: {
        position: 'asc'
      }
    });
    logger.debug('Plants fetched successfully', { count: plants.length });
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
    
    // Check if position is already occupied
    const existingPlant = await prisma.plant.findFirst({
      where: { 
        userId,
        position: position,
        status: { not: 'removed' }  // Only consider active plants
      }
    });

    if (existingPlant) {
      logger.warn('Position already occupied', { position, existingPlantId: existingPlant.id });
      return NextResponse.json(
        { error: `Position ${position} is already occupied by plant "${existingPlant.name}"` }, 
        { status: 409 } // Conflict status code
      );
    }

    const plant = await prisma.plant.create({
      data: {
        name,
        type,
        position,
        status: 'planted',
        startDate: new Date(),
        userId
      }
    });
    logger.info('Plant created successfully', { id: plant.id });
    return NextResponse.json(plant);
  } catch (error) {
    logger.error('Failed to create plant', { error });
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
