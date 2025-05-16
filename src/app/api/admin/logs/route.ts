import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth-with-systems';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For now, allow any authenticated user to access the admin logs
    // In production, you would want to check for an admin role
    
    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    
    // Build where clause
    let whereClause: any = {};
    if (type) {
      whereClause.type = type;
    }
    
    // Fetch system logs
    const systemLogs = await prisma.systemLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        system: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        logDate: 'desc'
      },
      take: limit
    });
    
    // Transform the data to match the expected format in the client
    const formattedLogs = systemLogs.map(log => ({
      id: log.id,
      level: getMappedLogLevel(log.type),
      message: generateLogMessage(log),
      timestamp: log.logDate.toISOString(),
      source: log.systemName || 'system',
      type: log.type,
      value: log.value,
      unit: log.unit,
      note: log.note,
      userName: log.user.name || log.user.email,
      userId: log.user.id
    }));
    
    return NextResponse.json(formattedLogs);
  } catch (error) {
    logger.error('Error fetching admin logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// Helper function to map system log types to log levels
function getMappedLogLevel(type: string): string {
  const typeMap: Record<string, string> = {
    ph_measurement: 'INFO',
    ec_measurement: 'INFO',
    tds_measurement: 'INFO',
    temperature: 'INFO',
    water_refill: 'INFO'
  };
  
  return typeMap[type] || 'INFO';
}

// Helper function to generate a readable message from the log data
function generateLogMessage(log: any): string {
  const typeLabels: Record<string, string> = {
    ph_measurement: 'pH Level',
    ec_measurement: 'EC Level',
    tds_measurement: 'TDS Level',
    temperature: 'Temperature',
    water_refill: 'Water Refill'
  };
  
  const typeName = typeLabels[log.type] || log.type;
  const systemName = log.systemName || 'Unknown System';
  const userName = log.user.name || log.user.email;
  
  return `${typeName} recorded: ${log.value} ${log.unit} for ${systemName} by ${userName}${log.note ? ` - Note: ${log.note}` : ''}`;
}
