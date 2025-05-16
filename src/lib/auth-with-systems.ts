import { getAuthenticatedUser as origGetAuthenticatedUser, createSession, verifyPassword, hashPassword, logout, getCurrentUserId } from './auth';
import { prisma } from './prisma';
import { logger } from './logger';

// A wrapper for getAuthenticatedUser that adds systems data
export async function getAuthenticatedUserWithSystems() {
  try {
    // Get the basic user data with the original function
    const user = await origGetAuthenticatedUser();
    
    if (!user) {
      return null;
    }
    
    // Get the systems for this user
    const userSystems = await prisma.userSystem.findMany({
      where: { userId: user.id },
      include: { system: true }
    });
    
    // Return the user with systems
    return {
      ...user,
      systems: userSystems
    };
  } catch (error) {
    logger.error('Error getting user with systems', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    return null;
  }
}

// Re-export the original functions
export { createSession, verifyPassword, hashPassword, logout, getCurrentUserId };
