import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';
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
    
    // Get the active system ID (optional filter)
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    let whereClause: any = { userId };
    
    if (activeOnly) {
      const activeUserSystem = await getActiveUserSystem(userId);
      if (activeUserSystem) {
        whereClause.systemId = activeUserSystem.systemId;
      }
    }
    
    logger.info('Fetching system logs for user', { userId });
    const systemLogs = await prisma.systemLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        system: {
          select: {
            id: true,
            name: true
          }
        }
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
  systemId?: number;
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
    
    const { type, value, unit, note, logDate } = (await req.json()) as SystemLogInput;    logger.info('Creating system log', { type, userId });
    
    // Get the user's active system info
    const activeUserSystem = await getActiveUserSystem(userId);
    if (!activeUserSystem) {
      logger.warn('No active system found when creating system log', { userId });
      return NextResponse.json({ error: 'No active system found' }, { status: 404 });
    }
    
    const system = activeUserSystem.system;
    
    const log = await prisma.systemLog.create({
      data: {
        type,
        value,
        unit,
        note,
        logDate: logDate ? new Date(logDate) : new Date(),
        userId,
        systemId: system.id,
        systemName: system.name
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    logger.error('Failed to create system log', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
    });
    return NextResponse.json({ error: 'Failed to create system log' }, { status: 500 });
  }
}
