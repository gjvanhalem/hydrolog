// Mock Next.js Request/Response
const createNextResponse = (data: any, init?: any) => ({
  data,
  ...init,
  json: () => Promise.resolve(data)
});

const createNextRequest = (url: string, data?: any) => ({
  url,
  json: () => Promise.resolve(data),
  formData: () => Promise.resolve(new FormData())
});

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => createNextResponse(data, init))
  },
  NextRequest: jest.fn((url) => createNextRequest(url))
}));
