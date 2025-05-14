import '@testing-library/jest-dom';
import 'jest-environment-jsdom';
import { NextRequest } from 'next/server';

// Mock NextRequest globally for tests
(global as any).NextRequest = class {
  constructor(public body: any) {}
  async json() {
    return this.body;
  }
};

// Add any test environment setup here if needed
// Let Next.js handle its own Request/Response objects
