import '@testing-library/jest-dom';

// Mock Service Worker setup
import { server } from './src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close()); 