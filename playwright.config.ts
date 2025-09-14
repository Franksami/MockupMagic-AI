import { defineConfig, devices } from '@playwright/test';

/**
 * MockupMagic AI - Comprehensive Playwright Testing Configuration
 * Phase 4-5: Performance Validation & Cross-Browser Compatibility
 */

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for performance metrics
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    ...(process.env.CI ? [['github']] : [])
  ],

  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Screenshot and video settings for visual validation
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Performance testing viewport
    viewport: { width: 1920, height: 1080 },

    // Action timeout for performance testing
    actionTimeout: 15000,

    // Enable performance metrics collection
    launchOptions: {
      args: [
        '--enable-precise-memory-info',
        '--disable-blink-features=AutomationControlled',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--force-color-profile=srgb'
      ]
    }
  },

  // Comprehensive browser matrix for Phase 5
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable performance testing features
        contextOptions: {
          // Collect performance metrics
          recordHar: { path: 'test-results/har/' },
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
    },

    // Mobile Browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14 Pro'] },
    },

    {
      name: 'mobile-safari-landscape',
      use: { ...devices['iPhone 14 Pro landscape'] },
    },

    // Performance-specific configurations
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // CPU throttling for performance testing
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ],
        },
      },
    },

    // Accessibility testing configuration
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force color scheme for accessibility testing
        colorScheme: 'dark',
        // Reduce motion for accessibility
        reducedMotion: 'reduce',
      },
    },
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120000,
  },
});