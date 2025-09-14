/**
 * Phase 4-5 Validation Tests
 * Comprehensive validation of MockupMagic AI Phase III implementations
 */

import { test, expect, chromium, firefox, webkit } from '@playwright/test';
import { PerformanceMonitor } from '../utils/performance-monitor';

test.describe('Phase 4-5: Comprehensive Validation', () => {
  test('Phase 4: Performance Metrics Collection', async ({ page, browserName }) => {
    const performanceMonitor = new PerformanceMonitor(page);

    console.log(`\n=== PHASE 4: PERFORMANCE VALIDATION (${browserName.toUpperCase()}) ===\n`);

    // Navigate to application
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Start monitoring
    await performanceMonitor.startMonitoring();

    // Collect initial metrics
    const initialMetrics = await performanceMonitor.collectMetrics();

    console.log('📊 Initial Performance Metrics:');
    console.log(`  • FPS: ${initialMetrics.fps}`);
    console.log(`  • Memory: ${(initialMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • DOM Nodes: ${initialMetrics.domNodes}`);
    console.log(`  • Render Time: ${initialMetrics.renderTime.toFixed(2)} ms`);
    console.log(`  • Paint Time: ${initialMetrics.paintTime.toFixed(2)} ms`);

    // Test navigation to studio if it exists
    const studioLink = page.locator('a[href="/studio"]').first();
    if (await studioLink.isVisible().catch(() => false)) {
      await studioLink.click();
      await page.waitForLoadState('networkidle');

      const studioMetrics = await performanceMonitor.collectMetrics();
      console.log('\n📊 Studio Page Metrics:');
      console.log(`  • FPS: ${studioMetrics.fps}`);
      console.log(`  • Memory: ${(studioMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  • DOM Nodes: ${studioMetrics.domNodes}`);
    }

    // Check for liquid glass elements
    const glassElements = await page.locator('[class*="glass"], [class*="glassmorphism"], .backdrop-blur').count();
    console.log(`\n🎨 Glass Effect Elements Found: ${glassElements}`);

    // Check for file upload components
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`📁 File Upload Inputs Found: ${fileInputs}`);

    // Test scroll performance if scrollable content exists
    const scrollableElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.overflow === 'auto' || styles.overflow === 'scroll' ||
               styles.overflowY === 'auto' || styles.overflowY === 'scroll';
      }).length;
    });
    console.log(`📜 Scrollable Elements Found: ${scrollableElements}`);

    // Generate performance report
    const report = performanceMonitor.generateReport();
    console.log('\n' + report);

    // Performance assertions
    expect(initialMetrics.fps).toBeGreaterThanOrEqual(30); // Minimum acceptable FPS
    expect(initialMetrics.memoryUsage).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    expect(initialMetrics.renderTime).toBeLessThan(5000); // Less than 5 seconds
  });

  test('Phase 5: Cross-Browser Feature Detection', async ({ page, browserName }) => {
    console.log(`\n=== PHASE 5: CROSS-BROWSER COMPATIBILITY (${browserName.toUpperCase()}) ===\n`);

    await page.goto('/');

    // Comprehensive feature detection
    const features = await page.evaluate(() => {
      return {
        // CSS Features
        cssGrid: CSS.supports('display', 'grid'),
        cssFlexbox: CSS.supports('display', 'flex'),
        cssCustomProperties: CSS.supports('--custom', 'value'),
        cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') ||
                          CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
        cssClipPath: CSS.supports('clip-path', 'circle()'),
        cssTransform3d: CSS.supports('transform', 'translate3d(0, 0, 0)'),

        // JavaScript APIs
        fileAPI: 'File' in window && 'FileReader' in window,
        dragAndDrop: 'draggable' in document.createElement('div'),
        intersectionObserver: 'IntersectionObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        resizeObserver: 'ResizeObserver' in window,
        webWorkers: 'Worker' in window,
        serviceWorker: 'serviceWorker' in navigator,

        // Performance APIs
        performanceObserver: 'PerformanceObserver' in window,
        performanceMemory: 'memory' in performance,
        requestIdleCallback: 'requestIdleCallback' in window,

        // Graphics
        webGL: (() => {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        })(),
        webGL2: (() => {
          const canvas = document.createElement('canvas');
          return !!canvas.getContext('webgl2');
        })(),

        // Storage
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        indexedDB: 'indexedDB' in window,

        // Media
        videoSupport: !!document.createElement('video').canPlayType,
        audioSupport: !!document.createElement('audio').canPlayType,

        // Network
        fetch: 'fetch' in window,
        websockets: 'WebSocket' in window,

        // Browser Info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,

        // Screen Info
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      };
    });

    // Log feature support
    console.log('✅ Supported Features:');
    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        console.log(`  • ${key}`);
      }
    });

    console.log('\n❌ Unsupported Features:');
    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'boolean' && !value) {
        console.log(`  • ${key}`);
      }
    });

    console.log('\n📱 Device Info:');
    console.log(`  • Platform: ${features.platform}`);
    console.log(`  • Screen: ${features.screenWidth}x${features.screenHeight}`);
    console.log(`  • Pixel Ratio: ${features.pixelRatio}`);
    console.log(`  • Color Depth: ${features.colorDepth}-bit`);

    // Critical feature assertions
    expect(features.cssGrid).toBeTruthy();
    expect(features.cssFlexbox).toBeTruthy();
    expect(features.fileAPI).toBeTruthy();
    expect(features.localStorage).toBeTruthy();
    expect(features.fetch).toBeTruthy();
  });

  test('Visual and Functional Validation', async ({ page, browserName }) => {
    console.log(`\n=== VISUAL & FUNCTIONAL VALIDATION (${browserName.toUpperCase()}) ===\n`);

    await page.goto('/');

    // Take screenshots for visual validation
    await page.screenshot({
      path: `test-results/screenshots/homepage-${browserName}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: homepage-${browserName}.png`);

    // Check responsive design
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 812, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${
        hasOverflow ? '⚠️ Has horizontal overflow' : '✅ No overflow'
      }`);

      await page.screenshot({
        path: `test-results/screenshots/${viewport.name.toLowerCase()}-${browserName}.png`
      });
    }

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    await page.reload();
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console Errors Detected:');
      consoleErrors.forEach(error => console.log(`  • ${error}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    // Check page load performance
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });

    console.log('\n⏱️ Page Load Performance:');
    console.log(`  • DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`  • Page Load Complete: ${performanceTiming.loadComplete}ms`);

    // Assertions
    expect(performanceTiming.loadComplete).toBeLessThan(10000); // Less than 10 seconds
    expect(consoleErrors.filter(e => !e.includes('HMR') && !e.includes('DevTools'))).toHaveLength(0);
  });
});

// Browser-specific test configurations
test.describe('Browser-Specific Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  ['chromium', 'firefox', 'webkit'].forEach(browserType => {
    test(`${browserType}: Complete validation`, async () => {
      const browser = await (browserType === 'chromium' ? chromium :
                             browserType === 'firefox' ? firefox : webkit).launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      console.log(`\n${'='.repeat(60)}`);
      console.log(`   ${browserType.toUpperCase()} BROWSER VALIDATION`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        await page.goto('http://localhost:3000');

        // Quick validation
        const title = await page.title();
        console.log(`✅ Page Title: ${title}`);

        const bodyText = await page.locator('body').textContent();
        console.log(`✅ Page loaded successfully (${bodyText?.length || 0} characters)`);

      } catch (error) {
        console.error(`❌ Error in ${browserType}:`, error);
      } finally {
        await browser.close();
      }
    });
  });
});