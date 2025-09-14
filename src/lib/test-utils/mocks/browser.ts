/**
 * MSW browser setup for component testing and development
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW service worker for browser environment
export const worker = setupWorker(...handlers);

// Function to start MSW in browser
export async function startMSW() {
  if (typeof window !== 'undefined') {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true, // Reduce console noise during tests
      });
      console.log('[MSW] Mock Service Worker started in browser');
    } catch (error) {
      console.error('[MSW] Failed to start service worker:', error);
    }
  }
}

// Function to stop MSW
export async function stopMSW() {
  if (typeof window !== 'undefined') {
    try {
      worker.stop();
      console.log('[MSW] Mock Service Worker stopped');
    } catch (error) {
      console.error('[MSW] Failed to stop service worker:', error);
    }
  }
}

// Function to reset handlers (useful for test isolation)
export function resetMSW() {
  worker.resetHandlers();
}