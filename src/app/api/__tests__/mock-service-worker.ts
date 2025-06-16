import { setupServer } from 'msw/node';

// Setup empty server as base
export const server = setupServer();

// Setup before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close()); 