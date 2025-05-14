import { createMocks } from 'node-mocks-http';
import { POST } from '../update/route';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock NextRequest for testing
const mockNextRequest = (body: any): NextRequest => {
  return {
    json: async () => body,
  } as NextRequest;
};

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    plant: {
      deleteMany: jest.fn()
    },
    system: {
      update: jest.fn()
    }
  }
}));

describe('POST /api/system/update', () => {
  it('should return 401 if user is not authenticated', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const req = mockNextRequest({
      systemName: 'New System',
      rows: 3,
      positionsPerRow: 12,
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if system details are missing', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ id: 1, systemId: 1 });

    const req = mockNextRequest({});

    const response = await POST(req);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'System details are required' });
  });

  it('should delete plants and update the system', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ id: 1, systemId: 1 });
    (prisma.plant.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
    (prisma.system.update as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Updated System',
      rows: 4,
      positionsPerRow: 10
    });

    const req = mockNextRequest({
      systemName: 'Updated System',
      rows: 4,
      positionsPerRow: 10,
    });

    const response = await POST(req);

    expect(prisma.plant.deleteMany).toHaveBeenCalledWith({ where: { systemId: 1 } });
    expect(prisma.system.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Updated System',
        rows: 4,
        positionsPerRow: 10
      }
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      system: {
        id: 1,
        name: 'Updated System',
        rows: 4,
        positionsPerRow: 10
      }
    });
  });
});
