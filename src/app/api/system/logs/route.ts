import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const systemLogs = await prisma.systemLog.findMany({
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

export async function POST(req: NextRequest) {
  try {
    const { type, value, unit, note, logDate } = (await req.json()) as SystemLogInput;
    const log = await prisma.systemLog.create({
      data: {
        type,
        value,
        unit,
        note,
        logDate: logDate ? new Date(logDate) : new Date()
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create system log' }, { status: 500 });
  }
}
