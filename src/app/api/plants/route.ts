import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Fetching all plants');
    const plants = await prisma.plant.findMany({
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
    const { name, type, position } = await req.json();
    logger.info('Creating new plant', { name, type, position });
    const plant = await prisma.plant.create({
      data: {
        name,
        type,
        position,
        status: 'planted',
        startDate: new Date()
      }
    });
    logger.info('Plant created successfully', { id: plant.id });
    return NextResponse.json(plant);
  } catch (error) {
    logger.error('Failed to create plant', { error });
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
