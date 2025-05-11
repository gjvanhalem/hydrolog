import { vi } from 'vitest';

class MockRequest {
  constructor(url: string) {
    this.url = url;
  }
  url: string;
  formData = vi.fn();
  json = vi.fn();
}

class MockResponse {
  static json(data: any, init?: any) {
    return {
      data,
      ...init
    };
  }
}

export { MockRequest as NextRequest, MockResponse as NextResponse };

// Add this to jest.setup.ts to make it available for all tests
Object.defineProperty(window, 'fetch', {
  value: jest.fn()
});
