import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { logger } from '@/lib/logger';
import { toNumber } from '@/lib/decimal-utils';

// Helper function to safely convert Decimal values to JavaScript numbers
function convertDecimalValues(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  // Function to safely convert potential Decimal fields
  const convertField = (fieldName: string) => {
    if (fieldName in result && result[fieldName] !== null && result[fieldName] !== undefined) {
      result[fieldName] = toNumber(result[fieldName]);
    }
  };
  
  // Convert all potential Decimal fields
  ['ph_min', 'ph_max', 'ec_min', 'ec_max', 'ppm_min', 'ppm_max', 'external_id'].forEach(convertField);
  
  return result;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    const id = parseInt(params.id);
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plantId = parseInt(params.id);
    if (isNaN(plantId)) {
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 });
    }

    // Get the updates from the request body
    const {
      ph_min,
      ph_max,
      ec_min,
      ec_max,
      ppm_min,
      ppm_max
    } = await req.json();

    // First check if the plant exists and belongs to the user
    const existingPlant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId
      }
    });

    if (!existingPlant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    logger.info('Updating plant parameters', { plantId, userId });

    // Prepare data with proper type conversions
    const updateData: any = {};

    // Add optional fields with proper type conversion
    if (ph_min !== undefined) {
      updateData.ph_min = ph_min === null ? null : Number(ph_min);
    }

    if (ph_max !== undefined) {
      updateData.ph_max = ph_max === null ? null : Number(ph_max);
    }

    if (ec_min !== undefined) {
      updateData.ec_min = ec_min === null ? null : Number(ec_min);
    }

    if (ec_max !== undefined) {
      updateData.ec_max = ec_max === null ? null : Number(ec_max);
    }

    if (ppm_min !== undefined) {
      updateData.ppm_min = ppm_min === null ? null : Number(ppm_min);
    }

    if (ppm_max !== undefined) {
      updateData.ppm_max = ppm_max === null ? null : Number(ppm_max);
    }    // Update the plant with the new parameters
    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: updateData
    });

    logger.info('Plant parameters updated successfully', { plantId });
    
    // Convert any Decimal values to JavaScript numbers before returning
    const safeData = convertDecimalValues(updatedPlant);
    
    return NextResponse.json(safeData);
  } catch (error) {
    logger.error('Failed to update plant parameters', { error });
    return NextResponse.json({ error: 'Failed to update plant parameters' }, { status: 500 });
  }
}
