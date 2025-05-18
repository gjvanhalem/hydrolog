import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';

// Add revalidation for GET requests
export const revalidate = 60; // Cache for 60 seconds

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
    
    const { 
      name, 
      type, 
      position, 
      ph_min, 
      ph_max, 
      ec_min, 
      ec_max, 
      ppm_min, 
      ppm_max, 
      external_id 
    } = await req.json();
    
    // Basic validation
    if (!name || !type || !position) {
      return NextResponse.json(
        { error: 'Name, type, and position are required' },
        { status: 400 }
      );
    }
    
    logger.info('Creating new plant', { name, type, position, userId, external_id });
    
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
    
    // Create a typed data object
    interface PlantData {
      name: string;
      type: string;
      position: number;
      status: string;
      startDate: Date;
      userId: number;
      systemId: number;
      ph_min?: number | null;
      ph_max?: number | null;
      ec_min?: number | null;
      ec_max?: number | null;
      ppm_min?: number | null;
      ppm_max?: number | null;
      external_id?: number | null;
    }
    
    // Prepare data with proper type conversions
    const plantData: PlantData = {
      name,
      type,
      position: Number(position),
      status: 'active',
      startDate: new Date(),
      userId,
      systemId
    };
    
    // Add optional fields with proper type conversion
    if (ph_min !== undefined && ph_min !== null) {
      plantData.ph_min = Number(ph_min);
    }
    
    if (ph_max !== undefined && ph_max !== null) {
      plantData.ph_max = Number(ph_max);
    }
    
    if (ec_min !== undefined && ec_min !== null) {
      plantData.ec_min = Number(ec_min);
    }
    
    if (ec_max !== undefined && ec_max !== null) {
      plantData.ec_max = Number(ec_max);
    }
    
    if (ppm_min !== undefined && ppm_min !== null) {
      plantData.ppm_min = Number(ppm_min);
    }
    
    if (ppm_max !== undefined && ppm_max !== null) {
      plantData.ppm_max = Number(ppm_max);
    }
    
    if (external_id !== undefined && external_id !== null) {
      plantData.external_id = Number(external_id);
    }
    
    // Create the plant with the prepared data
    const plant = await prisma.plant.create({
      data: plantData as any
    });
    
    logger.info('Plant created successfully', { plantId: plant.id, systemId });
    return NextResponse.json(plant);
  } catch (error) {
    logger.error('Failed to create plant', { error });
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
