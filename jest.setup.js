import '@testing-library/jest-dom';

// Mock Service Worker setup
import { server } from './src/mocks/server';

// Mock fetch globally with proper Jest mock methods
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Detect if we're in a Node.js environment (for API tests)
const isNodeEnvironment = typeof window === 'undefined';

if (isNodeEnvironment) {
  // Mock Next.js globals for API route testing in Node environment
  global.Request = jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
  }));

  global.Response = jest.fn().mockImplementation((body, options) => ({
    status: options?.status || 200,
    statusText: options?.statusText || 'OK',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(body),
  }));

  global.Headers = jest.fn().mockImplementation((init) => {
    const headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        headers.set(key.toLowerCase(), value);
      });
    }
    return headers;
  });
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());