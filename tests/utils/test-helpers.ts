/**
 * Test Helper Utilities for MockupMagic AI
 * Common utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test';
import path from 'path';

export interface TestFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

/**
 * Generate mock test files for upload testing
 */
export async function generateTestFiles(): Promise<TestFile[]> {
  return [
    {
      name: 'test-image-small.jpg',
      path: path.join(__dirname, '../fixtures/test-image-small.jpg'),
      size: 500 * 1024, // 500KB
      type: 'image/jpeg'
    },
    {
      name: 'test-image-large.png',
      path: path.join(__dirname, '../fixtures/test-image-large.png'),
      size: 10 * 1024 * 1024, // 10MB
      type: 'image/png'
    },
    {
      name: 'test-image.webp',
      path: path.join(__dirname, '../fixtures/test-image.webp'),
      size: 2 * 1024 * 1024, // 2MB
      type: 'image/webp'
    }
  ];
}

/**
 * Wait for liquid glass effects to be loaded
 */
export async function waitForLiquidGlass(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const elements = document.querySelectorAll('[class*="liquid-glass"]');
    return elements.length > 0 &&
           Array.from(elements).every(el => {
             const styles = window.getComputedStyle(el);
             return styles.backdropFilter !== 'none' ||
                    (styles as any).webkitBackdropFilter !== 'none';
           });
  });
}

/**
 * Check if browser supports backdrop-filter
 */
export async function checkBackdropFilterSupport(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const testEl = document.createElement('div');
    testEl.style.backdropFilter = 'blur(10px)';
    (testEl.style as any).webkitBackdropFilter = 'blur(10px)';
    return testEl.style.backdropFilter !== '' ||
           (testEl.style as any).webkitBackdropFilter !== '';
  });
}

/**
 * Generate mock template data for virtual scrolling tests
 */
export function generateMockTemplates(count: number = 1000): any[] {
  const categories = ['Marketing', 'Sales', 'Design', 'Development', 'Analytics'];
  const templates = [];

  for (let i = 0; i < count; i++) {
    templates.push({
      id: `template-${i}`,
      name: `Template ${i + 1}`,
      description: `This is a description for template ${i + 1}`,
      category: categories[i % categories.length],
      thumbnail: `/api/placeholder/200/150`,
      rating: Math.random() * 5,
      uses: Math.floor(Math.random() * 10000),
      isPremium: Math.random() > 0.7,
      tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1)
    });
  }

  return templates;
}

/**
 * Measure component mount time
 */
export async function measureMountTime(
  page: Page,
  componentSelector: string
): Promise<number> {
  const mountTime = await page.evaluate((selector) => {
    const startTime = performance.now();
    const element = document.querySelector(selector);

    if (!element) {
      throw new Error(`Component ${selector} not found`);
    }

    // Wait for component to be fully rendered
    return new Promise<number>((resolve) => {
      const observer = new MutationObserver(() => {
        const endTime = performance.now();
        observer.disconnect();
        resolve(endTime - startTime);
      });

      observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: true
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(performance.now() - startTime);
      }, 5000);
    });
  }, componentSelector);

  return mountTime;
}

/**
 * Simulate network conditions
 */
export async function simulateNetworkCondition(
  page: Page,
  condition: 'fast' | 'slow' | '3g' | 'offline'
): Promise<void> {
  const conditions = {
    fast: {
      downloadThroughput: 10 * 1024 * 1024 / 8, // 10 Mbps
      uploadThroughput: 5 * 1024 * 1024 / 8,    // 5 Mbps
      latency: 20
    },
    slow: {
      downloadThroughput: 500 * 1024 / 8,       // 500 Kbps
      uploadThroughput: 250 * 1024 / 8,         // 250 Kbps
      latency: 400
    },
    '3g': {
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8,          // 750 Kbps
      latency: 150
    },
    offline: {
      offline: true
    }
  };

  const context = page.context();
  if (condition === 'offline') {
    await context.setOffline(true);
  } else {
    await context.setOffline(false);
    // Note: Network throttling is only available in Chromium
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      ...conditions[condition]
    } as any);
  }
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Take visual regression screenshot
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    mask?: string[];
  }
): Promise<void> {
  const screenshotOptions: any = {
    path: `tests/screenshots/${name}.png`,
    fullPage: options?.fullPage || false
  };

  if (options?.clip) {
    screenshotOptions.clip = options.clip;
  }

  if (options?.mask) {
    const locators = options.mask.map(selector => page.locator(selector));
    screenshotOptions.mask = locators;
  }

  await page.screenshot(screenshotOptions);
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.querySelectorAll('*')).map((element) => {
        const animations = element.getAnimations();
        return Promise.all(animations.map(animation => animation.finished));
      })
    );
  });
}

/**
 * Check mobile responsiveness
 */
export async function checkMobileResponsiveness(
  page: Page,
  viewports: Array<{ width: number; height: number; name: string }>
): Promise<{ [key: string]: boolean }> {
  const results: { [key: string]: boolean } = {};

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500); // Wait for resize to complete

    const isResponsive = await page.evaluate(() => {
      // Check for horizontal overflow
      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;

      // Check if text is readable (font size >= 12px)
      const texts = Array.from(document.querySelectorAll('p, span, div, a'));
      const readableText = texts.every(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        return fontSize >= 12 || fontSize === 0; // 0 for hidden elements
      });

      // Check if buttons/links are tappable (min 44x44px)
      const interactives = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const tappable = interactives.every(el => {
        const rect = el.getBoundingClientRect();
        return (rect.width >= 44 && rect.height >= 44) ||
               (rect.width === 0 && rect.height === 0); // Hidden elements
      });

      return !hasOverflow && readableText && tappable;
    });

    results[viewport.name] = isResponsive;
  }

  return results;
}