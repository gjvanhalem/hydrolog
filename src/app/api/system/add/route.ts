import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { addSystemForUser } from '@/lib/system-utils';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Validation schema for adding a system
const AddSystemSchema = z.object({
  name: z.string().min(1, 'System name is required'),
  rows: z.number().int().min(1, 'At least one row is required'),
  positionsPerRow: z.array(z.number().int().min(0)).min(1, 'Position configuration is required')
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = AddSystemSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    // Add the system
    const systemData = validationResult.data;
    const userSystem = await addSystemForUser(userId, systemData);
    
    if (!userSystem) {
      return NextResponse.json({ error: 'Failed to add system' }, { status: 500 });
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
    
    return NextResponse.json({ success: true, userSystem, user });
  } catch (error) {
    logger.error('Error adding system', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
