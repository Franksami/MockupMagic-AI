import { test, expect, type Page } from '@playwright/test';

// Test configuration
const API_TIMEOUT = 30000;
const UPLOAD_TIMEOUT = 60000;
const GENERATION_TIMEOUT = 300000; // 5 minutes for AI generation

test.describe('MockupMagic AI - Comprehensive System Testing', () => {

  test.describe('Core API Validation', () => {
    test('should validate authentication endpoint', async ({ request }) => {
      const response = await request.get('/api/auth/whop');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.isAuthenticated).toBe(true);
      expect(data.whopUser.id).toBe('dev_user_123');
      expect(data.convexUser.subscriptionTier).toBe('pro');
      expect(data.convexUser.creditsRemaining).toBeGreaterThan(0);
    });

    test('should validate generation API with proper parameters', async ({ request }) => {
      const response = await request.post('/api/generate', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          category: 'digital',
          style: 'studio',
          quality: 'draft',
          productName: 'Test Product',
          productDescription: 'A test product for validation'
        }
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.mockupIds).toBeDefined();
      expect(data.data.jobIds).toBeDefined();
      expect(data.data.creditsUsed).toBeGreaterThan(0);
    });

    test('should validate templates API', async ({ request }) => {
      const response = await request.get('/api/templates');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.templates)).toBe(true);
      expect(data.data.total).toBeGreaterThanOrEqual(0);
    });

    test('should handle API validation errors properly', async ({ request }) => {
      const response = await request.post('/api/generate', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          category: 'invalid_category',
          style: 'invalid_style',
          quality: 'invalid_quality'
        }
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(data.error.details)).toBe(true);
    });
  });

  test.describe('Frontend Application Flow', () => {
    test('should load homepage with proper branding', async ({ page }) => {
      await page.goto('/');

      // Check page loads
      await expect(page).toHaveTitle(/MockupMagic/i);

      // Check main navigation is present
      await expect(page.getByRole('navigation')).toBeVisible();

      // Check call-to-action is present
      await expect(page.getByRole('button', { name: /start creating/i })).toBeVisible();
    });

    test('should navigate to studio page', async ({ page }) => {
      await page.goto('/');

      // Navigate to studio
      await page.getByRole('link', { name: /studio/i }).click();

      // Verify we're on studio page
      await expect(page).toHaveURL(/\/studio/);

      // Check studio components are loaded
      await expect(page.getByText(/create mockup/i)).toBeVisible();
    });

    test('should display user authentication info', async ({ page }) => {
      await page.goto('/studio');

      // Wait for authentication to load
      await page.waitForFunction(() => {
        return window.fetch('/api/auth/whop', { credentials: 'include' })
          .then(r => r.json())
          .then(d => d.isAuthenticated === true);
      }, { timeout: 10000 });

      // Check user info is displayed (in development mode)
      await expect(page.getByText(/dev user/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/pro/i)).toBeVisible();
    });

    test('should load templates properly', async ({ page }) => {
      await page.goto('/studio');

      // Navigate to templates tab if it exists
      const templatesTab = page.getByRole('tab', { name: /templates/i });
      if (await templatesTab.isVisible()) {
        await templatesTab.click();
      }

      // Wait for templates to load
      await page.waitForResponse(response =>
        response.url().includes('/api/templates') && response.ok()
      );

      // Verify templates are displayed
      await expect(page.locator('[data-testid*="template"], .template-card, .template-item')).toHaveCount({ min: 1 });
    });
  });

  test.describe('User Interaction Testing', () => {
    test('should handle form interactions', async ({ page }) => {
      await page.goto('/studio');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Look for any input fields
      const inputs = page.locator('input, select, textarea').first();
      if (await inputs.isVisible()) {
        await inputs.focus();
        await inputs.fill('test value');
        await expect(inputs).toHaveValue('test value');
      }

      // Look for buttons and ensure they're clickable
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        await expect(buttons).toBeEnabled();
        await buttons.hover(); // Test hover states
      }
    });

    test('should handle navigation properly', async ({ page }) => {
      await page.goto('/');

      // Test navigation links
      const navLinks = page.locator('nav a, [role="navigation"] a').first();
      if (await navLinks.isVisible()) {
        const href = await navLinks.getAttribute('href');
        await navLinks.click();

        if (href && href.startsWith('/')) {
          await expect(page).toHaveURL(new RegExp(href));
        }
      }
    });
  });

  test.describe('Performance Validation', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/studio');

      // Measure Largest Contentful Paint (LCP)
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      expect(lcp).toBeLessThan(2500); // 2.5s threshold

      // Measure Cumulative Layout Shift (CLS)
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      expect(cls).toBeLessThan(0.1); // 0.1 threshold
    });

    test('should load within performance budgets', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/studio');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5s max load time
    });
  });

  test.describe('Error Handling Validation', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block API calls to simulate network issues
      await page.route('/api/**', (route) => {
        route.abort();
      });

      await page.goto('/studio');

      // The page should still render basic content
      await expect(page.locator('body')).toBeVisible();

      // Should show error states where appropriate
      const errorMessages = page.locator('[data-testid*="error"], .error-message, .error-state');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });

    test('should handle invalid routes properly', async ({ page }) => {
      await page.goto('/nonexistent-route');

      // Should either redirect to valid page or show 404
      const is404 = page.locator('text=/404|not found/i');
      const isRedirected = !page.url().includes('nonexistent-route');

      expect(await is404.isVisible() || isRedirected).toBe(true);
    });
  });

  test.describe('Accessibility Validation', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');

      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount({ min: 1 });

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/studio');

      // Check for buttons with accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const hasAccessibleName = await button.evaluate(btn => {
              return !!(btn.textContent?.trim() ||
                       btn.getAttribute('aria-label') ||
                       btn.getAttribute('title'));
            });
            expect(hasAccessibleName).toBe(true);
          }
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);

      // Should have focusable elements
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].some(tag =>
        focused?.includes(tag)
      )).toBe(true);
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);

        await page.goto('/');

        // Basic functionality test
        await expect(page.locator('body')).toBeVisible();
        await expect(page).toHaveTitle(/MockupMagic/i);

        // Navigation test
        await page.goto('/studio');
        await expect(page).toHaveURL(/\/studio/);
      });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');

      await page.goto('/');

      // Check mobile layout
      await expect(page.locator('body')).toBeVisible();

      // Test touch interactions if on mobile
      const touchableElement = page.locator('button, a, [role="button"]').first();
      if (await touchableElement.isVisible()) {
        await touchableElement.tap();
      }
    });

    test('should handle viewport changes', async ({ page }) => {
      await page.goto('/');

      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('body')).toBeVisible();

      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('body')).toBeVisible();

      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

// Utility functions for test helpers
async function waitForApiResponse(page: Page, endpoint: string, timeout = API_TIMEOUT) {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.ok(),
    { timeout }
  );
}

async function checkElementAccessibility(page: Page, selector: string) {
  return page.locator(selector).evaluate(element => {
    // Check for accessible name
    const hasAccessibleName = !!(
      element.textContent?.trim() ||
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.getAttribute('alt')
    );

    // Check for proper role
    const hasRole = !!(
      element.getAttribute('role') ||
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
    );

    return { hasAccessibleName, hasRole };
  });
}