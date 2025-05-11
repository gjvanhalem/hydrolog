import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: {
        position: 'asc'
      }
    });
    return NextResponse.json(plants);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, position } = await req.json();
    const plant = await prisma.plant.create({
      data: {
        name,
        type,
        position,
        status: 'planted',
        startDate: new Date()
      }
    });
    return NextResponse.json(plant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}
