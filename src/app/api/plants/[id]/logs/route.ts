import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/decimal-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const logs = await prisma.plantLog.findMany({
      where: {
        plantId: parseInt(params.id)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Convert any Decimal values to JavaScript numbers
    const safeData = logs.map(log => ({
      ...log,
      // Add any Decimal fields that need conversion here if needed
    }));
    
    return NextResponse.json(safeData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plant logs' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {    const { status, note, photo, logDate } = await request.json();

    const log = await prisma.plantLog.create({
      data: {
        plantId: parseInt(params.id),
        status,
        note: note || null, // Handle empty strings by converting to null
        photo,
        logDate: logDate ? new Date(logDate) : new Date()
      }
    });// Update the plant's status
    await prisma.plant.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        status
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plant log' }, { status: 500 });
  }
}
