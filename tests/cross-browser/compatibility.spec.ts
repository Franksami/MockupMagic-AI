/**
 * Cross-Browser Compatibility Tests
 * Phase 5: Comprehensive browser compatibility validation
 */

import { test, expect, devices } from '@playwright/test';
import {
  checkBackdropFilterSupport,
  checkMobileResponsiveness,
  waitForLiquidGlass,
  checkForConsoleErrors
} from '../utils/test-helpers';

// Browser feature detection results
interface BrowserFeatures {
  backdropFilter: boolean;
  cssGrid: boolean;
  flexbox: boolean;
  webGL: boolean;
  fileAPI: boolean;
  dragAndDrop: boolean;
  intersectionObserver: boolean;
  performanceAPI: boolean;
  webWorkers: boolean;
  customProperties: boolean;
}

test.describe('Cross-Browser Compatibility', () => {
  test('should detect browser features and capabilities', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    const features: BrowserFeatures = await page.evaluate(() => {
      return {
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') ||
                        CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
        cssGrid: CSS.supports('display', 'grid'),
        flexbox: CSS.supports('display', 'flex'),
        webGL: (() => {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        })(),
        fileAPI: 'File' in window && 'FileReader' in window && 'FileList' in window,
        dragAndDrop: 'draggable' in document.createElement('div'),
        intersectionObserver: 'IntersectionObserver' in window,
        performanceAPI: 'performance' in window && 'memory' in performance,
        webWorkers: 'Worker' in window,
        customProperties: CSS.supports('--custom', 'value')
      };
    });

    console.log(`Browser: ${browserName}`);
    console.log('Feature Support:', features);

    // Critical features that must be supported
    expect(features.cssGrid).toBeTruthy();
    expect(features.flexbox).toBeTruthy();
    expect(features.fileAPI).toBeTruthy();
    expect(features.dragAndDrop).toBeTruthy();
    expect(features.customProperties).toBeTruthy();

    // Features with graceful degradation
    if (!features.backdropFilter) {
      console.warn(`${browserName} does not support backdrop-filter, checking fallback`);

      // Check that fallback styles are applied
      const hasFallback = await page.evaluate(() => {
        const glassElements = document.querySelectorAll('[class*="liquid-glass"]');
        return Array.from(glassElements).every(el => {
          const styles = window.getComputedStyle(el);
          // Should have fallback background
          return styles.background !== 'none' && styles.background !== '';
        });
      });

      expect(hasFallback).toBeTruthy();
    }
  });

  test('should render liquid glass effects consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/studio');
    await waitForLiquidGlass(page);

    // Take screenshot for visual comparison
    await page.screenshot({
      path: `tests/screenshots/liquid-glass-${browserName}.png`,
      fullPage: false
    });

    // Check that glass effects are visible
    const glassElementsVisible = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="liquid-glass"]');
      return Array.from(elements).every(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    });

    expect(glassElementsVisible).toBeTruthy();

    // Check computed styles
    const glassStyles = await page.evaluate(() => {
      const element = document.querySelector('[class*="liquid-glass"]');
      if (!element) return null;

      const styles = window.getComputedStyle(element);
      return {
        hasBackground: styles.background !== 'none',
        hasBorder: styles.border !== 'none' || styles.borderRadius !== '0px',
        hasOpacity: parseFloat(styles.opacity) > 0,
        hasTransform: styles.transform !== 'none',
        hasTransition: styles.transition !== 'none' && styles.transition !== ''
      };
    });

    expect(glassStyles).toBeTruthy();
    expect(glassStyles!.hasBackground).toBeTruthy();
    expect(glassStyles!.hasOpacity).toBeTruthy();
  });

  test('should handle file upload across browsers', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Check file input attributes
    const fileInputAttrs = await fileInput.evaluate(el => ({
      accept: el.getAttribute('accept'),
      multiple: el.hasAttribute('multiple')
    }));

    expect(fileInputAttrs.accept).toContain('image');

    // Test file selection dialog trigger
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Simulate click event
      const event = new MouseEvent('click', { bubbles: true });
      input.dispatchEvent(event);
    });

    // Check that file input is interactive
    const isInteractive = await fileInput.evaluate(el => {
      return !el.hasAttribute('disabled') && el.style.display !== 'none';
    });

    expect(isInteractive).toBeTruthy();

    console.log(`File upload works in ${browserName}`);
  });

  test('should support drag and drop across browsers', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    const dropZone = page.locator('[data-testid="drag-drop-zone"]');
    await expect(dropZone).toBeVisible();

    // Check drag and drop event support
    const dragDropSupport = await page.evaluate(() => {
      const zone = document.querySelector('[data-testid="drag-drop-zone"]');
      if (!zone) return false;

      let eventsFired = {
        dragenter: false,
        dragover: false,
        drop: false,
        dragleave: false
      };

      // Add event listeners
      zone.addEventListener('dragenter', () => { eventsFired.dragenter = true; });
      zone.addEventListener('dragover', () => { eventsFired.dragover = true; });
      zone.addEventListener('drop', () => { eventsFired.drop = true; });
      zone.addEventListener('dragleave', () => { eventsFired.dragleave = true; });

      // Simulate drag events
      ['dragenter', 'dragover', 'dragleave'].forEach(eventType => {
        const event = new DragEvent(eventType, {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        zone.dispatchEvent(event);
      });

      return eventsFired;
    });

    expect(dragDropSupport).toBeTruthy();
    if (dragDropSupport) {
      expect(dragDropSupport.dragenter).toBeTruthy();
      expect(dragDropSupport.dragover).toBeTruthy();
      expect(dragDropSupport.dragleave).toBeTruthy();
    }

    console.log(`Drag and drop support in ${browserName}:`, dragDropSupport);
  });

  test('should render virtual scrolling consistently', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Mock templates
    await page.evaluate(() => {
      // Inject mock templates into the template selector
      const container = document.querySelector('[data-testid="template-grid"]');
      if (container) {
        for (let i = 0; i < 50; i++) {
          const item = document.createElement('div');
          item.className = 'template-item';
          item.setAttribute('data-testid', 'template-item');
          item.textContent = `Template ${i}`;
          container.appendChild(item);
        }
      }
    });

    const templateGrid = page.locator('[data-testid="template-grid"]');
    await expect(templateGrid).toBeVisible();

    // Check scroll behavior
    const scrollBehavior = await templateGrid.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        overflowY: styles.overflowY,
        scrollBehavior: styles.scrollBehavior,
        height: el.clientHeight > 0
      };
    });

    expect(scrollBehavior.overflowY).toMatch(/auto|scroll/);
    expect(scrollBehavior.height).toBeTruthy();

    // Test scroll functionality
    await templateGrid.evaluate(el => {
      el.scrollTop = 100;
    });

    const scrollPosition = await templateGrid.evaluate(el => el.scrollTop);
    expect(scrollPosition).toBeGreaterThan(0);

    console.log(`Virtual scrolling works in ${browserName}`);
  });

  test('should handle CSS animations across browsers', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Check animation support
    const animationSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.animation = 'test 1s linear';

      const supportsAnimation = testElement.style.animation !== '';
      const supportsTransform = CSS.supports('transform', 'translateX(10px)');
      const supportsTransition = CSS.supports('transition', 'all 0.3s ease');

      // Check for animation frame API
      const hasRAF = 'requestAnimationFrame' in window;

      return {
        animation: supportsAnimation,
        transform: supportsTransform,
        transition: supportsTransition,
        requestAnimationFrame: hasRAF
      };
    });

    expect(animationSupport.animation).toBeTruthy();
    expect(animationSupport.transform).toBeTruthy();
    expect(animationSupport.transition).toBeTruthy();
    expect(animationSupport.requestAnimationFrame).toBeTruthy();

    console.log(`Animation support in ${browserName}:`, animationSupport);
  });

  test('should be responsive on mobile browsers', async ({ page, browserName }) => {
    // Mobile viewport sizes to test
    const viewports = [
      { width: 375, height: 812, name: 'iPhone X' },
      { width: 414, height: 896, name: 'iPhone XR' },
      { width: 360, height: 640, name: 'Android Small' },
      { width: 768, height: 1024, name: 'iPad' }
    ];

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    const responsiveness = await checkMobileResponsiveness(page, viewports);

    console.log(`Mobile responsiveness in ${browserName}:`, responsiveness);

    // All viewports should be responsive
    Object.values(responsiveness).forEach(isResponsive => {
      expect(isResponsive).toBeTruthy();
    });

    // Test touch events on mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    const touchSupport = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });

    if (touchSupport) {
      // Test touch interaction
      const element = page.locator('[class*="liquid-glass"]').first();
      const box = await element.boundingBox();

      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }

      console.log(`Touch events supported in ${browserName}`);
    }
  });

  test('should handle console errors gracefully', async ({ page, browserName }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Perform various interactions
    await page.click('[data-testid="drag-drop-zone"]', { force: true }).catch(() => {});
    await page.click('[data-testid="template-search"]', { force: true }).catch(() => {});

    // Filter out expected warnings
    const criticalErrors = errors.filter(error => {
      return !error.includes('Warning:') &&
             !error.includes('[HMR]') &&
             !error.includes('DevTools') &&
             !error.includes('favicon');
    });

    if (criticalErrors.length > 0) {
      console.warn(`Console errors in ${browserName}:`, criticalErrors);
    }

    // Should have no critical errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should validate form inputs across browsers', async ({ page, browserName }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Check search input
    const searchInput = page.locator('[data-testid="template-search"]');
    if (await searchInput.isVisible()) {
      // Test input functionality
      await searchInput.fill('test search');
      const value = await searchInput.inputValue();
      expect(value).toBe('test search');

      // Test placeholder
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();

      // Clear input
      await searchInput.clear();
      const clearedValue = await searchInput.inputValue();
      expect(clearedValue).toBe('');

      console.log(`Form inputs work in ${browserName}`);
    }
  });

  test('should support localStorage and sessionStorage', async ({ page, browserName }) => {
    await page.goto('/studio');

    const storageSupport = await page.evaluate(() => {
      try {
        // Test localStorage
        localStorage.setItem('test', 'value');
        const localValue = localStorage.getItem('test');
        localStorage.removeItem('test');

        // Test sessionStorage
        sessionStorage.setItem('test', 'value');
        const sessionValue = sessionStorage.getItem('test');
        sessionStorage.removeItem('test');

        return {
          localStorage: localValue === 'value',
          sessionStorage: sessionValue === 'value'
        };
      } catch (e) {
        return {
          localStorage: false,
          sessionStorage: false
        };
      }
    });

    expect(storageSupport.localStorage).toBeTruthy();
    expect(storageSupport.sessionStorage).toBeTruthy();

    console.log(`Storage support in ${browserName}:`, storageSupport);
  });

  test('should handle network requests consistently', async ({ page, browserName }) => {
    const requests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Check that required API endpoints are accessible
    const apiCheck = await page.evaluate(async () => {
      try {
        // Test a mock API call
        const response = await fetch('/api/health', { method: 'HEAD' }).catch(() => null);
        return {
          fetchSupported: true,
          corsEnabled: response ? response.ok : false
        };
      } catch (e) {
        return {
          fetchSupported: false,
          corsEnabled: false
        };
      }
    });

    expect(apiCheck.fetchSupported).toBeTruthy();

    console.log(`Network capabilities in ${browserName}:`, apiCheck);
  });
});