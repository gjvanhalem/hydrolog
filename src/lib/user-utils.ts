import { prisma } from './prisma';
import { logger } from './logger';

export async function getUserSystem(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        systemId: true,
        system: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return user?.system || null;
  } catch (error) {
    logger.error('Failed to get user system', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId
    });
    return null;
  }
}
