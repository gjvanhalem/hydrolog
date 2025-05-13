import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/system/logs/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemLog: {
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
      json: () => Promise.resolve(data),
      ok: true,
    }),
  },
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    ...init,
    json: () => Promise.resolve(init?.body ? JSON.parse(init.body) : {}),
  })),
}));

describe('System Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns system logs ordered by creation time descending', async () => {
      // Create mock logs
      const mockSystemLogs = [
        { 
          id: 2, 
          type: 'ph_measurement', 
          value: 6.8, 
          unit: 'pH', 
          note: 'After adding solution',
          createdAt: new Date('2025-05-13T10:30:00Z')
        },
        { 
          id: 1, 
          type: 'ec_measurement', 
          value: 1200, 
          unit: 'µS/cm', 
          note: null,
          createdAt: new Date('2025-05-12T09:00:00Z')
        }
      ];
      
      // Mock Prisma response
      (prisma.systemLog.findMany as jest.Mock).mockResolvedValue(mockSystemLogs);
      
      // Make API request
      const response = await GET({} as NextRequest, { params: {} });
      const data = await response.json();
      
      // Check response
      expect(data).toEqual(mockSystemLogs);
      expect(prisma.systemLog.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });
    });

    it('handles errors during fetch', async () => {
      // Mock database error
      (prisma.systemLog.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));
      
      // Make API request
      const response = await GET({} as NextRequest, { params: {} });
      const data = await response.json();
      
      // Check error response
      expect(data).toEqual({ error: 'Failed to fetch system logs' });
      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('creates a new system log', async () => {
      // Create input data
      const newLog = {
        type: 'ph_measurement',
        value: 6.5,
        unit: 'pH',
        note: 'Test reading',
        logDate: '2025-05-13'
      };

      // Create mock response with dates
      const mockDate = new Date('2025-05-13T12:00:00Z');
      const mockCreatedLog = {
        ...newLog,
        id: 3,
        logDate: new Date(newLog.logDate),
        createdAt: mockDate,
        updatedAt: mockDate
      };
      
      // Mock Prisma response
      (prisma.systemLog.create as jest.Mock).mockResolvedValue(mockCreatedLog);
      
      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/system/logs', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      
      // Make API request
      const response = await POST(request, { params: {} });
      const data = await response.json();
      
      // Check response
      expect(data).toEqual(mockCreatedLog);
      expect(prisma.systemLog.create).toHaveBeenCalledWith({
        data: {
          type: newLog.type,
          value: newLog.value,
          unit: newLog.unit,
          note: newLog.note,
          logDate: new Date(newLog.logDate)
        }
      });
    });

    it('creates a log with current date when logDate is not provided', async () => {
      // Create input without a date
      const newLog = {
        type: 'ec_measurement',
        value: 1250,
        unit: 'µS/cm',
        note: 'No date specified'
      };
      
      // Mock the date
      const mockNow = new Date('2025-05-13T15:30:00Z');
      const realDateNow = Date.now;
      global.Date.now = jest.fn(() => mockNow.getTime());
      global.Date = jest.fn(() => mockNow) as any;
      global.Date.UTC = realDateNow;
      
      // Mock response
      const mockCreatedLog = {
        ...newLog,
        id: 4,
        logDate: mockNow,
        createdAt: mockNow,
        updatedAt: mockNow
      };
      
      (prisma.systemLog.create as jest.Mock).mockResolvedValue(mockCreatedLog);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/system/logs', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      
      // Make API request
      const response = await POST(request, { params: {} });
      const data = await response.json();
      
      // Check response
      expect(data).toEqual(mockCreatedLog);      expect(prisma.systemLog.create).toHaveBeenCalledWith({
        data: {
          type: newLog.type,
          value: newLog.value,
          unit: newLog.unit,
          note: newLog.note,
          logDate: mockNow
        }
      });
      
      // Restore Date
      global.Date.now = realDateNow;
    });

    it('handles errors during creation', async () => {
      // Mock database error
      (prisma.systemLog.create as jest.Mock).mockRejectedValue(new Error('Invalid data'));
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/system/logs', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid_type',
          value: 'not_a_number', // This should be a number
          unit: 'pH'
        })
      });
      
      // Make API request
      const response = await POST(request, { params: {} });
      const data = await response.json();
      
      // Check error response
      expect(data).toEqual({ error: 'Failed to create system log' });
      expect(response.status).toBe(500);
    });
  });
});
