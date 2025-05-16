import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { 
  getUserSystems, 
  getActiveUserSystem, 
  setActiveSystem,
  addSystemForUser,
  removeSystemForUser
} from '../src/lib/system-utils';
import { prisma } from '../src/lib/prisma';

describe('Multi-system Feature Integration Tests', () => {
  // Test user and systems data
  const testUserId = 999999;
  let createdSystems: any[] = [];
  
  beforeAll(async () => {
    // Create a test user if needed
    const existingUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: 'test-multi-system@example.com',
          password: 'dummy-password-hash'
        }
      });
    }
    
    // Remove any existing systems for this test user
    const existingSystems = await getUserSystems(testUserId);
    for (const userSystem of existingSystems) {
      await removeSystemForUser(testUserId, userSystem.systemId);
    }
  });
  
  afterAll(async () => {
    // Clean up - remove all created systems
    for (const system of createdSystems) {
      try {
        await removeSystemForUser(testUserId, system.systemId);
      } catch (error) {
        console.error('Error cleaning up test system:', error);
      }
    }
    
    // Delete test user
    /*
    await prisma.user.delete({
      where: { id: testUserId }
    });
    */
  });
  
  test('should create a new system for a user', async () => {
    const systemData = {
      name: 'Test System 1',
      rows: 2,
      positionsPerRow: [6, 6]
    };
    
    const userSystem = await addSystemForUser(testUserId, systemData);
    createdSystems.push(userSystem);
    
    expect(userSystem).not.toBeNull();
    expect(userSystem.system.name).toBe(systemData.name);
    expect(userSystem.system.positionsPerRow).toEqual(systemData.positionsPerRow);
    expect(userSystem.isActive).toBe(true); // First system should be active
  });
  
  test('should add a second system and maintain active state', async () => {
    const systemData = {
      name: 'Test System 2',
      rows: 3,
      positionsPerRow: [4, 4, 4]
    };
    
    const userSystem = await addSystemForUser(testUserId, systemData);
    createdSystems.push(userSystem);
    
    expect(userSystem).not.toBeNull();
    expect(userSystem.system.name).toBe(systemData.name);
    expect(userSystem.isActive).toBe(false); // Second system should not be active
    
    // Check that the first system is still active
    const activeSystem = await getActiveUserSystem(testUserId);
    expect(activeSystem?.system.name).toBe('Test System 1');
  });
  
  test('should switch active system', async () => {
    // Get second system
    const systems = await getUserSystems(testUserId);
    const system2 = systems.find(s => s.system.name === 'Test System 2');
    
    // Set system 2 as active
    const success = await setActiveSystem(testUserId, system2!.systemId);
    expect(success).toBe(true);
    
    // Verify system 2 is now active
    const activeSystem = await getActiveUserSystem(testUserId);
    expect(activeSystem?.system.name).toBe('Test System 2');
  });
  
  test('should list all user systems in correct order', async () => {
    // Add a third system
    const systemData = {
      name: 'Test System 3',
      rows: 1,
      positionsPerRow: [10]
    };
    
    const userSystem = await addSystemForUser(testUserId, systemData);
    createdSystems.push(userSystem);
    
    // Get all systems
    const systems = await getUserSystems(testUserId);
    
    // Should have 3 systems
    expect(systems.length).toBe(3);
    
    // Active system should be first
    expect(systems[0].system.name).toBe('Test System 2');
    expect(systems[0].isActive).toBe(true);
  });
  
  test('should remove a system', async () => {
    // Get all systems
    const systems = await getUserSystems(testUserId);
    const system3 = systems.find(s => s.system.name === 'Test System 3');
    
    // Remove system 3
    const success = await removeSystemForUser(testUserId, system3!.systemId);
    expect(success).toBe(true);
    
    // Check that system was removed
    const updatedSystems = await getUserSystems(testUserId);
    expect(updatedSystems.length).toBe(2);
    expect(updatedSystems.find(s => s.system.name === 'Test System 3')).toBeUndefined();
    
    // Remove system 3 from our tracking array
    createdSystems = createdSystems.filter(s => s.system.name !== 'Test System 3');
  });
  
  test('should handle removing active system', async () => {
    // Get all systems
    const systems = await getUserSystems(testUserId);
    const activeSystem = systems.find(s => s.isActive);
    const inactiveSystem = systems.find(s => !s.isActive);
    
    // Remove active system
    const success = await removeSystemForUser(testUserId, activeSystem!.systemId);
    expect(success).toBe(true);
    
    // Check that system was removed
    const updatedSystems = await getUserSystems(testUserId);
    expect(updatedSystems.length).toBe(1);
    
    // The remaining system should now be active
    expect(updatedSystems[0].isActive).toBe(true);
    expect(updatedSystems[0].systemId).toBe(inactiveSystem!.systemId);
    
    // Remove from our tracking array
    createdSystems = createdSystems.filter(s => s.systemId !== activeSystem!.systemId);
  });
});
