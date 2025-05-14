import { createMocks } from 'node-mocks-http';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import * as auth from '@/lib/auth';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getCurrentUserId: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Plant History API Route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 unauthorized when user is not authenticated', async () => {
    // Mock getCurrentUserId to return null (not authenticated)
    (auth.getCurrentUserId as jest.Mock).mockResolvedValue(null);

    // Make API request
    const { res } = createMocks({
      method: 'GET',
    });

    await GET();

    // Parse response
    const data = JSON.parse(res._getData());
    
    // Verify response
    expect(res._getStatusCode()).toBe(401);
    expect(data.error).toBe('Authentication required to access plant history');
  });

  it('returns plant history data when user is authenticated', async () => {
    // Mock user ID
    const mockUserId = 123;
    
    // Mock plant data
    const mockPlantData = [
      {
        id: 1,
        name: 'Tomato',
        type: 'Vegetable',
        status: 'removed',
        logs: [
          {
            id: 101,
            status: 'harvested',
            note: 'Final harvest',
            logDate: '2025-05-10T12:00:00Z',
            photo: null,
          },
        ],
        startDate: '2025-04-01T00:00:00Z',
        updatedAt: '2025-05-10T12:00:00Z',
      },
    ];

    // Set up mocks
    (auth.getCurrentUserId as jest.Mock).mockResolvedValue(mockUserId);
    (prisma.plant.findMany as jest.Mock).mockResolvedValue(mockPlantData);

    // Make API request
    const { res } = createMocks({
      method: 'GET',
    });

    await GET();

    // Parse response
    const data = JSON.parse(res._getData());
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(data).toEqual(mockPlantData);
    
    // Check that prisma was called with the correct parameters
    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        status: 'removed',
      },
      include: {
        logs: {
          orderBy: {
            logDate: 'desc',
          },
          select: {
            id: true,
            status: true,
            note: true,
            photo: true,
            logDate: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  });
});
