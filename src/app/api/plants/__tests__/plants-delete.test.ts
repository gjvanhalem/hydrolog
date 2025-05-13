import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    plant: {
      update: jest.fn()
    }
  }
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      headers: new Map([['Content-Type', 'application/json']]),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      ok: init?.status ? init.status < 400 : true,
      data
    }))
  }
}));

describe('Plants Delete API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('DELETE method should mark a plant as removed', async () => {
    // Setup mock response for prisma.plant.update
    const mockPlantUpdate = prisma.plant.update as jest.MockedFunction<typeof prisma.plant.update>;
    mockPlantUpdate.mockResolvedValue({
      id: 1,
      name: 'Test Plant',
      status: 'removed',
      position: null
    });
    
    // Import the route handler after mocks are set up
    const { DELETE } = require('@/app/api/plants/[id]/route');
    
    // Call the DELETE handler with test parameters
    const request = {} as Request;
    const params = { id: '1' };
    const response = await DELETE(request, { params });
    
    // Verify the prisma call
    expect(mockPlantUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'removed',
        position: undefined
      }
    });
    
    // Verify response
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });
  });
  
  test('DELETE should return 400 for invalid ID', async () => {
    // Import the route handler after mocks are set up
    const { DELETE } = require('@/app/api/plants/[id]/route');
    
    // Call with invalid ID
    const request = {} as Request;
    const params = { id: 'invalid' };
    const response = await DELETE(request, { params });
    
    // Verify response
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: 'Invalid ID' });
  });
  
  test('DELETE should return 500 for database errors', async () => {
    // Setup mock to throw an error
    const mockPlantUpdate = prisma.plant.update as jest.MockedFunction<typeof prisma.plant.update>;
    mockPlantUpdate.mockRejectedValue(new Error('Database error'));
    
    // Import the route handler after mocks are set up
    const { DELETE } = require('@/app/api/plants/[id]/route');
    
    // Call with valid ID but database fails
    const request = {} as Request;
    const params = { id: '1' };
    const response = await DELETE(request, { params });
    
    // Verify response
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: 'Failed to remove plant from position' });
  });
});