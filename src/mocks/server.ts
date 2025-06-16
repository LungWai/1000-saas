import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Using MSW's setupServer function to create a mock server instance
export const server = setupServer(...handlers); 