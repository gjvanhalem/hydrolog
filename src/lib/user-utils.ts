import { prisma } from './prisma';
import { logger } from './logger';
import { getActiveUserSystem } from './system-utils';

// This function is deprecated - use getActiveUserSystem from system-utils instead
export async function getUserSystem(userId: number) {
  try {
    const activeUserSystem = await getActiveUserSystem(userId);
    return activeUserSystem ? activeUserSystem.system : null;
  } catch (error) {
    logger.error('Failed to get user system', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId
    });
    return null;
  }
}
