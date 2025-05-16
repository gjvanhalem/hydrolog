import { prisma } from './prisma';
import { logger } from './logger';
import { UserSystem, System } from '@prisma/client';

export type UserSystemWithSystem = UserSystem & {
  system: System;
};

/**
 * Get all systems associated with a user
 */
export async function getUserSystems(userId: number): Promise<UserSystemWithSystem[]> {
  try {
    const userSystems = await prisma.userSystem.findMany({
      where: { userId },
      include: {
        system: true
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return userSystems;
  } catch (error) {
    logger.error('Failed to get user systems', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId
    });
    return [];
  }
}

/**
 * Get the active system for a user
 */
export async function getActiveUserSystem(userId: number): Promise<UserSystemWithSystem | null> {
  try {
    const activeSystem = await prisma.userSystem.findFirst({
      where: {
        userId,
        isActive: true
      },
      include: {
        system: true
      }
    });
    
    return activeSystem;
  } catch (error) {
    logger.error('Failed to get active user system', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId
    });
    return null;
  }
}

/**
 * Set the active system for a user
 */
export async function setActiveSystem(userId: number, systemId: number): Promise<boolean> {
  try {
    // Begin a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, deactivate all systems for this user
      await tx.userSystem.updateMany({
        where: { userId },
        data: { isActive: false }
      });
      
      // Then activate the specified system
      await tx.userSystem.update({
        where: {
          userId_systemId: {
            userId,
            systemId
          }
        },
        data: { isActive: true }
      });
    });
    
    logger.info('Set active system for user', { userId, systemId });
    return true;
  } catch (error) {
    logger.error('Failed to set active system', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId,
      systemId
    });
    return false;
  }
}

/**
 * Add a system for a user
 */
export async function addSystemForUser(
  userId: number, 
  systemData: { name: string; rows: number; positionsPerRow: number[] }
): Promise<UserSystemWithSystem | null> {
  try {
    // Check if user already has any systems
    const existingSystems = await prisma.userSystem.count({
      where: { userId }
    });
    
    const shouldBeActive = existingSystems === 0;
    
    // Begin a transaction to ensure data consistency
    const userSystem = await prisma.$transaction(async (tx) => {
      // Create the new system
      const system = await tx.system.create({
        data: {
          name: systemData.name,
          rows: systemData.rows,
          positionsPerRow: systemData.positionsPerRow as any // Prisma handles the JSON conversion
        }
      });
      
      // If this is the first system, deactivate any other systems (shouldn't be any, but just to be safe)
      if (shouldBeActive) {
        await tx.userSystem.updateMany({
          where: { userId },
          data: { isActive: false }
        });
      }
      
      // Create the user-system relationship
      return await tx.userSystem.create({
        data: {
          userId,
          systemId: system.id,
          isActive: shouldBeActive,
          updatedAt: new Date()
        },
        include: {
          system: true
        }
      });
    });
    
    logger.info('Added system for user', { 
      userId, 
      systemId: userSystem.systemId, 
      isActive: userSystem.isActive 
    });
    
    return userSystem;
  } catch (error) {
    logger.error('Failed to add system for user', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId,
      systemData
    });
    return null;
  }
}

/**
 * Remove a system for a user
 */
export async function removeSystemForUser(userId: number, systemId: number): Promise<boolean> {
  try {
    // Check if this is the active system
    const userSystem = await prisma.userSystem.findUnique({
      where: {
        userId_systemId: {
          userId,
          systemId
        }
      }
    });
    
    if (!userSystem) {
      logger.warn('System not found for user', { userId, systemId });
      return false;
    }
    
    // Begin a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete the user-system relationship
      await tx.userSystem.delete({
        where: {
          userId_systemId: {
            userId,
            systemId
          }
        }
      });
      
      // Check if this was the active system
      if (userSystem.isActive) {
        // Find another system to make active
        const anotherSystem = await tx.userSystem.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' }
        });
        
        if (anotherSystem) {
          // Make the other system active
          await tx.userSystem.update({
            where: {
              id: anotherSystem.id
            },
            data: { isActive: true }
          });
        }
      }
      
      // If no other user has this system, delete it and its related data
      const otherUsers = await tx.userSystem.count({
        where: { systemId }
      });
      
      if (otherUsers === 0) {
        // Delete all plants associated with this system
        await tx.plant.deleteMany({
          where: { systemId }
        });
        
        // Delete system logs associated with this system
        await tx.systemLog.deleteMany({
          where: { systemId }
        });
        
        // Delete the system itself
        await tx.system.delete({
          where: { id: systemId }
        });
      }
    });
    
    logger.info('Removed system for user', { userId, systemId });
    return true;
  } catch (error) {
    logger.error('Failed to remove system for user', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId,
      systemId
    });
    return false;
  }
}
