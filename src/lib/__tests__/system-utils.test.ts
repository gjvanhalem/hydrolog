import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { 
  getUserSystems, 
  getActiveUserSystem, 
  setActiveSystem,
  addSystemForUser,
  removeSystemForUser
} from '../system-utils';
import { prisma } from '../prisma';

// Mock the Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    userSystem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    system: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    plant: {
      deleteMany: jest.fn(),
    },
    systemLog: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  }
}));

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('System Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSystems', () => {
    test('should return user systems', async () => {
      const mockSystems = [
        { id: 1, userId: 123, systemId: 456, isActive: true, system: { id: 456, name: 'System 1' } },
        { id: 2, userId: 123, systemId: 789, isActive: false, system: { id: 789, name: 'System 2' } }
      ];

      (prisma.userSystem.findMany as jest.Mock).mockResolvedValue(mockSystems);

      const result = await getUserSystems(123);
      
      expect(prisma.userSystem.findMany).toHaveBeenCalledWith({
        where: { userId: 123 },
        include: { system: true },
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      expect(result).toEqual(mockSystems);
    });

    test('should return empty array on error', async () => {
      (prisma.userSystem.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const result = await getUserSystems(123);
      
      expect(result).toEqual([]);
    });
  });

  describe('getActiveUserSystem', () => {
    test('should return active system', async () => {
      const mockActiveSystem = { 
        id: 1, 
        userId: 123, 
        systemId: 456, 
        isActive: true, 
        system: { id: 456, name: 'System 1' } 
      };
      
      (prisma.userSystem.findFirst as jest.Mock).mockResolvedValue(mockActiveSystem);
      
      const result = await getActiveUserSystem(123);
      
      expect(prisma.userSystem.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 123,
          isActive: true
        },
        include: {
          system: true
        }
      });
      
      expect(result).toEqual(mockActiveSystem);
    });
    
    test('should return null when no active system', async () => {
      (prisma.userSystem.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await getActiveUserSystem(123);
      
      expect(result).toBeNull();
    });
  });

  describe('setActiveSystem', () => {
    test('should set active system successfully', async () => {
      (prisma.userSystem.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.userSystem.update as jest.Mock).mockResolvedValue({ id: 1, isActive: true });
      
      const result = await setActiveSystem(123, 456);
      
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.userSystem.updateMany).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: { isActive: false }
      });
      
      expect(prisma.userSystem.update).toHaveBeenCalledWith({
        where: {
          userId_systemId: {
            userId: 123,
            systemId: 456
          }
        },
        data: { isActive: true }
      });
      
      expect(result).toBe(true);
    });
  });

  describe('addSystemForUser', () => {
    test('should add system for user with isActive=true when first system', async () => {
      const systemData = { name: 'New System', rows: 2, positionsPerRow: [8, 8] };
      
      (prisma.userSystem.count as jest.Mock).mockResolvedValue(0);
      (prisma.system.create as jest.Mock).mockResolvedValue({ 
        id: 789, 
        name: 'New System', 
        rows: 2, 
        positionsPerRow: [8, 8] 
      });
      
      (prisma.userSystem.create as jest.Mock).mockResolvedValue({
        id: 3,
        userId: 123,
        systemId: 789,
        isActive: true,
        system: {
          id: 789, 
          name: 'New System', 
          rows: 2, 
          positionsPerRow: [8, 8]
        }
      });
      
      const result = await addSystemForUser(123, systemData);
      
      expect(prisma.userSystem.count).toHaveBeenCalledWith({
        where: { userId: 123 }
      });
      
      expect(prisma.system.create).toHaveBeenCalledWith({
        data: {
          name: systemData.name,
          rows: systemData.rows,
          positionsPerRow: systemData.positionsPerRow
        }
      });
      
      expect(result).toEqual({
        id: 3,
        userId: 123,
        systemId: 789,
        isActive: true,
        system: {
          id: 789,
          name: 'New System',
          rows: 2,
          positionsPerRow: [8, 8]
        }
      });
    });
  });

  describe('removeSystemForUser', () => {
    test('should remove system and make another active if this was active', async () => {
      (prisma.userSystem.findUnique as jest.Mock).mockResolvedValue({ 
        id: 1, 
        userId: 123, 
        systemId: 456, 
        isActive: true 
      });
      
      (prisma.userSystem.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        userId: 123,
        systemId: 789,
        isActive: false
      });
      
      (prisma.userSystem.count as jest.Mock).mockResolvedValue(0);
      
      const result = await removeSystemForUser(123, 456);
      
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.userSystem.delete).toHaveBeenCalledWith({
        where: {
          userId_systemId: {
            userId: 123,
            systemId: 456
          }
        }
      });
      
      expect(prisma.userSystem.update).toHaveBeenCalledWith({
        where: {
          id: 2
        },
        data: { isActive: true }
      });
      
      expect(prisma.plant.deleteMany).toHaveBeenCalledWith({
        where: { systemId: 456 }
      });
      
      expect(prisma.systemLog.deleteMany).toHaveBeenCalledWith({
        where: { systemId: 456 }
      });
      
      expect(prisma.system.delete).toHaveBeenCalledWith({
        where: { id: 456 }
      });
      
      expect(result).toBe(true);
    });
  });
});
