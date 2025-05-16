import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { removeSystemForUser } from '@/lib/system-utils';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// This route handles removing a system from a user's account
// Route: /api/system/[id]/remove

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const systemId = parseInt(params.id);
    
    if (isNaN(systemId)) {
      return NextResponse.json({ error: 'Invalid system ID' }, { status: 400 });
    }
    
    // Check if the system exists and belongs to the user
    const userSystem = await prisma.userSystem.findUnique({
      where: {
        userId_systemId: {
          userId,
          systemId
        }
      }
    });
    
    if (!userSystem) {
      return NextResponse.json({ error: 'System not found or does not belong to you' }, { status: 404 });
    }
    
    // Remove the system
    const success = await removeSystemForUser(userId, systemId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove system' }, { status: 500 });
    }
    
    // Get full user data to return
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        systems: {
          include: { system: true }
        }
      }
    });
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error('Error removing system', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
