import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn()
  }
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      headers: new Map([
        ['Content-Type', 'application/json']
      ]),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      ok: init?.status ? init.status < 400 : true,
      // Store data for easier testing
      data
    }),
  },
  NextRequest: jest.fn().mockImplementation((url) => ({
    url
  })),
}));

// Mock process.uptime
const originalUptime = process.uptime;
process.uptime = jest.fn().mockReturnValue(3600); // 1 hour

describe('Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup environment variables
    process.env.npm_package_version = '0.1.0';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Restore the original process.uptime
    process.uptime = originalUptime;
  });
  it('returns healthy status when database is connected', async () => {
    // Mock successful database query
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    
    // Make API request
    const response = await GET({} as NextRequest);
    
    // Get response data
    const responseData = await response.json();
    
    // Check response
    expect(responseData).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      version: '0.1.0',
      uptime: 3600,
      environment: 'test'
    });
    
    // Verify database was queried
    expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything());
    
    // Verify logging occurred
    expect(logger.debug).toHaveBeenCalledWith('Health check passed', expect.anything());
  });
  it('returns unhealthy status when database connection fails', async () => {
    // Mock database error
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection error'));
    
    // Make API request
    const response = await GET({} as NextRequest);
    
    // Get response data
    const responseData = await response.json();
    
    // Check error response
    expect(responseData).toEqual({
      status: 'unhealthy',
      error: 'Service unavailable'
    });
    expect(response.status).toBe(503);
    
    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith('Health check failed', { error: expect.any(Error) });
  });
  it('uses default version when npm_package_version is not set', async () => {
    // Clear the version
    delete process.env.npm_package_version;
    
    // Mock successful database query
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    
    // Make API request
    const response = await GET({} as NextRequest);
    
    // Get response data
    const responseData = await response.json();
    
    // Check that default version is used
    expect(responseData.version).toBe('0.1.0');
  });
});
