// Setup for Node.js environment tests (API routes)

// Mock fetch for Node.js environment
global.fetch = jest.fn();

// Mock Next.js globals for API route testing
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

// Mock Service Worker setup for Node environment
const { server } = require('./src/mocks/server');

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());
