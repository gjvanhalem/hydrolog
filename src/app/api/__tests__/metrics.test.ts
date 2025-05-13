import { jest } from '@jest/globals';

// Import the metrics module
import * as MetricsModule from '@/lib/metrics';

// Mock the logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

describe('Metrics module', () => {
  describe('Basic functionality', () => {
    test('metrics functions exist', () => {
      expect(typeof MetricsModule.getMetrics).toBe('function');
      expect(typeof MetricsModule.updateMetrics).toBe('function');
    });
    
    test('getMetrics returns expected data structure', () => {
      const metrics = MetricsModule.getMetrics();
      
      // Basic structure tests only
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('lastRequest');
      expect(metrics).toHaveProperty('performance');
      
      expect(typeof metrics.requests).toBe('number');
      expect(typeof metrics.errors).toBe('number');
      expect(typeof metrics.lastRequest).toBe('number');
    });
    
    test('updateMetrics can be called with numeric status', () => {
      // Just verify it doesn't throw errors
      expect(() => {
        MetricsModule.updateMetrics(200);
        MetricsModule.updateMetrics(404);
        MetricsModule.updateMetrics(500);
      }).not.toThrow();
    });
  });
});