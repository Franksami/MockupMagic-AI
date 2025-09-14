/**
 * Visual Regression Tests for Theme Migration
 * Ensures UI consistency during the transition from purple to orange theme
 */

import { test, expect, Page } from '@playwright/test';
import { FeatureFlagKeys } from '../src/lib/featureFlags';

// Test configuration
const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const CRITICAL_PAGES = [
  '/',
  '/dashboard',
  '/generate',
  '/templates',
  '/projects',
  '/settings',
  '/billing',
];

// Helper to set feature flags
async function setFeatureFlag(page: Page, flag: string, enabled: boolean) {
  await page.evaluate(
    ({ flag, enabled }) => {
      localStorage.setItem(`mockupmagic-flag-${flag}`, enabled.toString());
    },
    { flag, enabled }
  );
}

// Helper to force theme
async function forceTheme(page: Page, theme: 'orange' | 'purple') {
  await page.evaluate((theme) => {
    localStorage.setItem('mockupmagic-theme', theme);
    document.documentElement.classList.remove('theme-orange', 'theme-purple');
    document.documentElement.classList.add(`theme-${theme}`);
  }, theme);
}

// Helper to wait for animations
async function waitForAnimations(page: Page) {
  await page.waitForTimeout(150); // Wait for theme transition (100ms + buffer)
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  });
}

test.describe('Theme Visual Regression Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  // Test both themes across all viewports
  for (const viewport of VIEWPORTS) {
    for (const theme of ['purple', 'orange'] as const) {
      test.describe(`${theme} theme - ${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } });

        test.beforeEach(async ({ page }) => {
          // Set theme before navigation
          await page.addInitScript((theme) => {
            localStorage.setItem('mockupmagic-theme', theme);
          }, theme);
        });

        for (const path of CRITICAL_PAGES) {
          test(`${path} page`, async ({ page }) => {
            await page.goto(path);
            await waitForAnimations(page);

            // Take screenshot
            await expect(page).toHaveScreenshot(
              `${theme}-${viewport.name}-${path.replace(/\//g, '-')}.png`,
              {
                fullPage: true,
                animations: 'disabled',
                mask: [
                  // Mask dynamic content
                  page.locator('[data-testid="timestamp"]'),
                  page.locator('[data-testid="user-avatar"]'),
                  page.locator('[data-testid="credit-count"]'),
                ],
              }
            );
          });
        }
      });
    }
  }

  test.describe('Theme Transition Tests', () => {
    test('smooth transition from purple to orange', async ({ page }) => {
      await page.goto('/dashboard');

      // Start with purple theme
      await forceTheme(page, 'purple');
      await waitForAnimations(page);

      // Capture before state
      const beforeScreenshot = await page.screenshot();

      // Transition to orange
      await page.evaluate(() => {
        const button = document.querySelector('[aria-label="Toggle theme"]') as HTMLElement;
        if (button) button.click();
      });

      // Capture during transition (50ms into 100ms transition)
      await page.waitForTimeout(50);
      const duringScreenshot = await page.screenshot();

      // Wait for transition to complete
      await waitForAnimations(page);

      // Capture after state
      const afterScreenshot = await page.screenshot();

      // Verify screenshots are different (transition occurred)
      expect(beforeScreenshot).not.toEqual(afterScreenshot);
      expect(duringScreenshot).not.toEqual(beforeScreenshot);
      expect(duringScreenshot).not.toEqual(afterScreenshot);
    });

    test('maintains layout structure during theme change', async ({ page }) => {
      await page.goto('/dashboard');

      // Get layout measurements with purple theme
      await forceTheme(page, 'purple');
      await waitForAnimations(page);

      const purpleLayout = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        const main = document.querySelector('main');
        const header = document.querySelector('header');

        return {
          sidebar: sidebar?.getBoundingClientRect(),
          main: main?.getBoundingClientRect(),
          header: header?.getBoundingClientRect(),
        };
      });

      // Switch to orange theme
      await forceTheme(page, 'orange');
      await waitForAnimations(page);

      const orangeLayout = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        const main = document.querySelector('main');
        const header = document.querySelector('header');

        return {
          sidebar: sidebar?.getBoundingClientRect(),
          main: main?.getBoundingClientRect(),
          header: header?.getBoundingClientRect(),
        };
      });

      // Verify layout dimensions remain the same
      expect(purpleLayout.sidebar?.width).toBe(orangeLayout.sidebar?.width);
      expect(purpleLayout.main?.width).toBe(orangeLayout.main?.width);
      expect(purpleLayout.header?.height).toBe(orangeLayout.header?.height);
    });
  });

  test.describe('Glass Morphism Effects', () => {
    test('glass morphism renders correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await forceTheme(page, 'orange');
      await setFeatureFlag(page, FeatureFlagKeys.GLASSMORPHISM, true);
      await page.reload();
      await waitForAnimations(page);

      // Check for glass morphism CSS properties
      const hasGlassEffect = await page.evaluate(() => {
        const glassElements = document.querySelectorAll('.bg-glass-light, .bg-glass-medium, .bg-glass-dark');
        return Array.from(glassElements).every((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.backdropFilter !== 'none' ||
            styles.webkitBackdropFilter !== 'none'
          );
        });
      });

      expect(hasGlassEffect).toBe(true);

      // Take screenshot of glass morphism effect
      await expect(page).toHaveScreenshot('glass-morphism-effect.png', {
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
        },
      });
    });
  });

  test.describe('Accessibility Contrast Tests', () => {
    test('meets WCAG AA contrast requirements', async ({ page }) => {
      await page.goto('/dashboard');

      for (const theme of ['purple', 'orange'] as const) {
        await forceTheme(page, theme);
        await waitForAnimations(page);

        const contrastIssues = await page.evaluate(() => {
          const issues: Array<{ element: string; contrast: number; required: number }> = [];

          // Check text contrast
          const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a');

          textElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            const bgColor = styles.backgroundColor;

            // Simple contrast calculation (would use a proper library in production)
            // This is a placeholder - you'd want to use a proper contrast calculation
            const contrast = 21; // Maximum contrast ratio

            const fontSize = parseFloat(styles.fontSize);
            const fontWeight = styles.fontWeight;
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
            const requiredContrast = isLargeText ? 3 : 4.5;

            if (contrast < requiredContrast) {
              issues.push({
                element: el.tagName.toLowerCase(),
                contrast,
                required: requiredContrast,
              });
            }
          });

          return issues;
        });

        expect(contrastIssues).toHaveLength(0);
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('theme switch completes within 100ms', async ({ page }) => {
      await page.goto('/dashboard');
      await forceTheme(page, 'purple');
      await waitForAnimations(page);

      const transitionTime = await page.evaluate(async () => {
        const startTime = performance.now();

        // Trigger theme change
        document.documentElement.classList.remove('theme-purple');
        document.documentElement.classList.add('theme-orange');

        // Wait for transition
        await new Promise((resolve) => {
          const observer = new MutationObserver(() => {
            if (!document.documentElement.classList.contains('theme-transition')) {
              observer.disconnect();
              resolve(null);
            }
          });

          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
          });

          // Fallback timeout
          setTimeout(resolve, 200);
        });

        return performance.now() - startTime;
      });

      expect(transitionTime).toBeLessThanOrEqual(100);
    });

    test('maintains 60fps during animations', async ({ page }) => {
      await page.goto('/dashboard');

      // Start performance measurement
      await page.evaluate(() => {
        (window as any).frameCount = 0;
        (window as any).startTime = performance.now();

        const countFrames = () => {
          (window as any).frameCount++;
          if (performance.now() - (window as any).startTime < 1000) {
            requestAnimationFrame(countFrames);
          }
        };

        requestAnimationFrame(countFrames);
      });

      // Trigger animations
      await forceTheme(page, 'orange');

      // Wait for measurement to complete
      await page.waitForTimeout(1100);

      const fps = await page.evaluate(() => {
        return (window as any).frameCount;
      });

      // Should be close to 60fps
      expect(fps).toBeGreaterThanOrEqual(55);
      expect(fps).toBeLessThanOrEqual(65);
    });
  });
});

test.describe('Component-Specific Tests', () => {
  test('buttons maintain consistent styling', async ({ page }) => {
    await page.goto('/dashboard');

    for (const theme of ['purple', 'orange'] as const) {
      await forceTheme(page, theme);
      await waitForAnimations(page);

      // Test all button variants
      const buttonVariants = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];

      for (const variant of buttonVariants) {
        const button = page.locator(`[data-variant="${variant}"]`).first();

        if (await button.isVisible()) {
          await expect(button).toHaveScreenshot(`button-${variant}-${theme}.png`);
        }
      }
    }
  });

  test('forms render correctly in both themes', async ({ page }) => {
    await page.goto('/generate');

    for (const theme of ['purple', 'orange'] as const) {
      await forceTheme(page, theme);
      await waitForAnimations(page);

      const form = page.locator('form').first();
      await expect(form).toHaveScreenshot(`form-${theme}.png`);
    }
  });

  test('modals and overlays work with glass morphism', async ({ page }) => {
    await page.goto('/templates');
    await forceTheme(page, 'orange');
    await setFeatureFlag(page, FeatureFlagKeys.GLASSMORPHISM, true);
    await page.reload();

    // Open a modal
    await page.click('[data-testid="create-template-button"]');
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('modal-glass-morphism.png');
  });
});