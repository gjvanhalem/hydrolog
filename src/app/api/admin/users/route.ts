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
    
    // For now, allow any authenticated user to access the admin user list
    // In production, you would want to check for an admin role
    
    // Get all users with limited information for security
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            plants: true,
            systems: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    logger.error('Error fetching users list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users list' },
      { status: 500 }
    );
  }
}
