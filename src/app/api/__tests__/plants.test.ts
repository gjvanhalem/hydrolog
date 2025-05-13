import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/plants/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ...init,
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      ok: init?.status ? init.status < 400 : true,
    }),
  },
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    ...init,
    json: () => Promise.resolve(init?.body ? JSON.parse(init.body) : {}),
  })),
}));

describe('Plants API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns plants ordered by position', async () => {
      const mockPlants = [
        { id: 1, position: 1, name: 'Plant 1' },
        { id: 2, position: 2, name: 'Plant 2' }
      ];
      
      (prisma.plant.findMany as jest.Mock).mockResolvedValue(mockPlants);
      
      const response = await GET();
      const data = await response.json();
      
      expect(data).toEqual(mockPlants);
      expect(prisma.plant.findMany).toHaveBeenCalledWith({
        orderBy: {
          position: 'asc'
        }
      });    });

    it('handles errors', async () => {
      (prisma.plant.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));
      
      const response = await GET();
      const data = await response.json();
      
      expect(data).toEqual({ error: 'Failed to fetch plants' });
    });
  });

  describe('POST', () => {
    it('creates a new plant', async () => {
      const newPlant = {
        name: 'New Plant',
        type: 'Tomato',
        position: 1
      };
        const mockDate = new Date('2025-05-10').toISOString();
      const mockCreatedPlant = {
        ...newPlant,
        id: 1,
        status: 'planted',
        startDate: mockDate,
        createdAt: mockDate,
        updatedAt: mockDate
      };
      
      (prisma.plant.create as jest.Mock).mockResolvedValue(mockCreatedPlant);
      
      const request = new NextRequest('http://localhost:3000/api/plants', {
        method: 'POST',
        body: JSON.stringify(newPlant)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(data).toEqual(mockCreatedPlant);
      expect(prisma.plant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: newPlant.name,
          type: newPlant.type,
          position: newPlant.position,
          status: 'planted'
        })
      });
    });    it('handles validation errors', async () => {
      // Mock prisma to throw an error for validation failures
      (prisma.plant.create as jest.Mock).mockRejectedValueOnce(new Error('Validation failed'));
      
      const request = new NextRequest('http://localhost:3000/api/plants', {
        method: 'POST',
        body: JSON.stringify({}) // Missing required fields
      });
      
      // Mock NextResponse to correctly set status
      const originalJsonFn = NextResponse.json;
      (NextResponse.json as jest.Mock) = jest.fn().mockImplementation((data, init) => {
        return {
          ...init,
          status: init?.status || 200,
          json: () => Promise.resolve(data)
        };
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      // Restore the original json function
      NextResponse.json = originalJsonFn;
      
      expect(data).toEqual({ error: 'Failed to create plant' });
    });
  });
});
