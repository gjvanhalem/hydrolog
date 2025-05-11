import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const logs = await prisma.plantLog.findMany({
      where: {
        plantId: parseInt(params.id)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plant logs' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {  try {
    const { status, note, photo, logDate } = await request.json();
    const log = await prisma.plantLog.create({
      data: {
        plantId: parseInt(params.id),
        status,
        note,
        photo,
        logDate: logDate ? new Date(logDate) : new Date()
      }
    });

    // Update the plant's status
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
