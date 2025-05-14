import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: {} }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching system logs for user', { userId });
    const systemLogs = await prisma.systemLog.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    return NextResponse.json(systemLogs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 });
  }
}

type SystemLogInput = {
  type: string;
  value: number;
  unit: string;
  note?: string;
  logDate?: string;
};

export async function POST(
  req: NextRequest,
  context: { params: {} }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { type, value, unit, note, logDate } = (await req.json()) as SystemLogInput;
    logger.info('Creating system log', { type, userId });
    
    const log = await prisma.systemLog.create({
      data: {
        type,
        value,
        unit,
        note,
        logDate: logDate ? new Date(logDate) : new Date(),
        userId
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create system log' }, { status: 500 });
  }
}
