/**
 * MSW server setup for Node.js testing environments
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for Node.js environment (for API route testing, etc.)
export const server = setupServer(...handlers);

// Setup functions for test lifecycle
export function setupMSWServer() {
  // Enable API mocking before all tests
  server.listen({
    onUnhandledRequest: 'bypass',
  });
  console.log('[MSW] Mock server started for Node.js tests');
}

export function resetMSWServer() {
  // Reset any request handlers that were added during tests
  server.resetHandlers();
}

export function cleanupMSWServer() {
  // Clean up after all tests
  server.close();
  console.log('[MSW] Mock server stopped');
}

// Export server for advanced test scenarios
export { server as mswServer };