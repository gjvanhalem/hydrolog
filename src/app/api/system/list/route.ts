import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getUserSystems } from '@/lib/system-utils';
import { logger } from '@/lib/logger';

// This route handles fetching all systems for the current user
// Route: /api/system/list

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get all systems for the user
    const userSystems = await getUserSystems(userId);
    
    return NextResponse.json({ 
      success: true, 
      systems: userSystems 
    });
  } catch (error) {
    logger.error('Error listing systems', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
