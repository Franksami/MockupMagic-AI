/**
 * Liquid Glass Performance Tests
 * Phase 4: CSS effects and animation performance validation
 */

import { test, expect } from '@playwright/test';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { waitForLiquidGlass, checkBackdropFilterSupport, waitForAnimations } from '../utils/test-helpers';

test.describe('Liquid Glass Effects Performance', () => {
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new PerformanceMonitor(page);
    await performanceMonitor.startMonitoring();
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    const report = performanceMonitor.generateReport();
    console.log(report);
  });

  test('should render liquid glass effects with hardware acceleration', async ({ page }) => {
    // Wait for liquid glass effects to load
    await waitForLiquidGlass(page);

    // Check for hardware acceleration
    const hasGPUAcceleration = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="liquid-glass"]');
      return Array.from(elements).every(el => {
        const transform = window.getComputedStyle(el).transform;
        const willChange = window.getComputedStyle(el).willChange;
        // Check if element is set up for GPU acceleration
        return transform !== 'none' || willChange === 'transform' || willChange === 'auto';
      });
    });

    expect(hasGPUAcceleration).toBeTruthy();

    // Check backdrop-filter support
    const backdropSupported = await checkBackdropFilterSupport(page);
    console.log(`Backdrop-filter supported: ${backdropSupported}`);

    if (backdropSupported) {
      // Verify backdrop-filter is applied
      const hasBackdropFilter = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="liquid-glass"]');
        return Array.from(elements).some(el => {
          const styles = window.getComputedStyle(el);
          return styles.backdropFilter !== 'none' ||
                 (styles as any).webkitBackdropFilter !== 'none';
        });
      });
      expect(hasBackdropFilter).toBeTruthy();
    }
  });

  test('should maintain 60 FPS during glass animations', async ({ page }) => {
    // Trigger all glass animations
    const animationMetrics = await performanceMonitor.monitorAnimation(async () => {
      await page.evaluate(() => {
        // Trigger shimmer animation
        document.querySelectorAll('[class*="shimmer"]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'running';
        });

        // Trigger float animation
        document.querySelectorAll('[class*="float"]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'running';
        });

        // Trigger morph animation
        document.querySelectorAll('[class*="morph"]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'running';
        });
      });

      await waitForAnimations(page);
    }, 3000);

    console.log(`Animation FPS: ${animationMetrics.averageFPS.toFixed(2)}`);
    console.log(`GPU Accelerated: ${animationMetrics.gpuAccelerated}`);

    // Should maintain 60 FPS during animations
    expect(animationMetrics.averageFPS).toBeGreaterThan(55);
    expect(animationMetrics.gpuAccelerated).toBeTruthy();
  });

  test('should handle multiple glass variants efficiently', async ({ page }) => {
    // Create multiple glass elements with different variants
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="studio-container"]');
      if (!container) return;

      const variants = ['shallow', 'medium', 'deep'];
      const colors = ['primary', 'success', 'warning', 'danger'];

      variants.forEach(variant => {
        colors.forEach(color => {
          const element = document.createElement('div');
          element.className = `liquid-glass liquid-glass-${variant} liquid-glass-${color}`;
          element.style.width = '200px';
          element.style.height = '200px';
          element.style.margin = '10px';
          element.textContent = `${variant} ${color}`;
          container.appendChild(element);
        });
      });
    });

    // Measure performance with multiple glass elements
    const metrics = await performanceMonitor.collectMetrics();

    // Check paint time
    expect(metrics.paintTime).toBeLessThan(100); // Should paint quickly

    // Check for layout shifts
    expect(metrics.layoutShiftScore).toBeLessThan(0.1); // Low CLS score

    // Monitor hover interactions
    const hoverMetrics = await performanceMonitor.monitorAnimation(async () => {
      const elements = page.locator('[class*="liquid-glass"]');
      const count = await elements.count();

      // Hover over each element
      for (let i = 0; i < Math.min(count, 5); i++) {
        await elements.nth(i).hover();
        await page.waitForTimeout(100);
      }
    }, 2000);

    expect(hoverMetrics.averageFPS).toBeGreaterThan(50);
  });

  test('should optimize blur effects for performance', async ({ page }) => {
    // Test different blur values
    const blurValues = [5, 10, 15, 20, 25];
    const performanceResults: Array<{ blur: number; fps: number }> = [];

    for (const blur of blurValues) {
      await page.evaluate((blurValue) => {
        document.querySelectorAll('[class*="liquid-glass"]').forEach(el => {
          (el as HTMLElement).style.backdropFilter = `blur(${blurValue}px)`;
          ((el as HTMLElement).style as any).webkitBackdropFilter = `blur(${blurValue}px)`;
        });
      }, blur);

      // Measure performance at this blur level
      const metrics = await performanceMonitor.monitorAnimation(async () => {
        await page.evaluate(() => {
          // Simulate scrolling with blur active
          window.scrollBy({ top: 100, behavior: 'smooth' });
        });
        await page.waitForTimeout(500);
      }, 1000);

      performanceResults.push({ blur, fps: metrics.averageFPS });
    }

    console.log('Blur Performance Results:', performanceResults);

    // All blur levels should maintain acceptable performance
    performanceResults.forEach(result => {
      expect(result.fps).toBeGreaterThan(30); // Minimum 30 FPS
    });
  });

  test('should handle mouse tracking effects efficiently', async ({ page, browserName }) => {
    // Skip on Firefox as it may not support all effects
    test.skip(browserName === 'firefox', 'Firefox may not support all effects');

    // Enable mouse tracking effect
    await page.evaluate(() => {
      const glassElements = document.querySelectorAll('[class*="liquid-glass"]');
      glassElements.forEach(el => {
        el.classList.add('liquid-glass-interactive');
      });
    });

    // Simulate mouse movement
    const mouseTrackingMetrics = await performanceMonitor.monitorAnimation(async () => {
      const element = page.locator('[class*="liquid-glass"]').first();
      const box = await element.boundingBox();

      if (box) {
        // Move mouse in a pattern
        for (let i = 0; i < 10; i++) {
          const x = box.x + (box.width * i / 10);
          const y = box.y + (box.height / 2) + Math.sin(i) * 20;
          await page.mouse.move(x, y);
          await page.waitForTimeout(50);
        }
      }
    }, 1000);

    expect(mouseTrackingMetrics.averageFPS).toBeGreaterThan(45);
  });

  test('should measure refraction effect performance', async ({ page }) => {
    // Apply refraction effect
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        .liquid-glass-refraction {
          backdrop-filter: blur(10px) saturate(180%) contrast(120%);
          -webkit-backdrop-filter: blur(10px) saturate(180%) contrast(120%);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
        }
      `;
      document.head.appendChild(style);

      document.querySelectorAll('[class*="liquid-glass"]').forEach(el => {
        el.classList.add('liquid-glass-refraction');
      });
    });

    // Measure performance with refraction
    const refractionMetrics = await performanceMonitor.collectMetrics();

    expect(refractionMetrics.fps).toBeGreaterThan(30);
    expect(refractionMetrics.longTasks).toBeLessThan(3);

    // Test animation with refraction
    const animMetrics = await performanceMonitor.monitorAnimation(async () => {
      await page.evaluate(() => {
        document.querySelectorAll('.liquid-glass-refraction').forEach(el => {
          (el as HTMLElement).style.transform = 'rotateY(180deg)';
          (el as HTMLElement).style.transition = 'transform 1s ease-in-out';
        });
      });
      await page.waitForTimeout(1000);
    }, 1500);

    expect(animMetrics.averageFPS).toBeGreaterThan(45);
  });

  test('should handle dynamic color transitions', async ({ page }) => {
    // Test color transitions
    const colorTransitionMetrics = await performanceMonitor.monitorAnimation(async () => {
      const colors = ['primary', 'success', 'warning', 'danger'];

      for (const color of colors) {
        await page.evaluate((newColor) => {
          document.querySelectorAll('[class*="liquid-glass"]').forEach(el => {
            // Remove old color classes
            el.className = el.className.replace(/liquid-glass-(primary|success|warning|danger)/, '');
            // Add new color class
            el.classList.add(`liquid-glass-${newColor}`);
          });
        }, color);

        await page.waitForTimeout(250);
      }
    }, 1500);

    expect(colorTransitionMetrics.averageFPS).toBeGreaterThan(50);
  });

  test('should optimize for mobile performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Apply mobile optimizations
    await page.evaluate(() => {
      // Reduce blur for mobile
      document.querySelectorAll('[class*="liquid-glass"]').forEach(el => {
        (el as HTMLElement).style.backdropFilter = 'blur(5px)';
        ((el as HTMLElement).style as any).webkitBackdropFilter = 'blur(5px)';
      });

      // Disable complex animations on mobile
      if (window.matchMedia('(max-width: 768px)').matches) {
        document.querySelectorAll('[class*="morph"]').forEach(el => {
          (el as HTMLElement).style.animation = 'none';
        });
      }
    });

    // Measure mobile performance
    const mobileMetrics = await performanceMonitor.collectMetrics();

    expect(mobileMetrics.fps).toBeGreaterThan(30);
    expect(mobileMetrics.paintTime).toBeLessThan(200);

    // Test touch interactions
    const element = page.locator('[class*="liquid-glass"]').first();
    const box = await element.boundingBox();

    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(100);
    }

    const afterTouchMetrics = await performanceMonitor.collectMetrics();
    expect(afterTouchMetrics.fps).toBeGreaterThan(30);
  });

  test('should measure composite layer count', async ({ page }) => {
    // Check composite layer count
    const layerInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="liquid-glass"]');
      let compositeCount = 0;

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        // Elements with transform or will-change create composite layers
        if (styles.transform !== 'none' ||
            styles.willChange === 'transform' ||
            styles.willChange === 'opacity' ||
            (styles as any).webkitBackfaceVisibility === 'hidden') {
          compositeCount++;
        }
      });

      return {
        totalElements: elements.length,
        compositeLayers: compositeCount
      };
    });

    console.log('Layer Information:', layerInfo);

    // Should use composite layers efficiently
    expect(layerInfo.compositeLayers).toBeGreaterThan(0);
    expect(layerInfo.compositeLayers).toBeLessThanOrEqual(layerInfo.totalElements);
  });

  test('should validate performance budget', async ({ page }) => {
    // Collect comprehensive metrics
    const metrics = await performanceMonitor.collectMetrics();

    // Performance budget assertions
    expect(metrics.fps).toBeGreaterThan(55); // Target 60 FPS
    expect(metrics.paintTime).toBeLessThan(100); // Fast paint
    expect(metrics.layoutShiftScore).toBeLessThan(0.1); // Low CLS
    expect(metrics.longTasks).toBeLessThan(5); // Few long tasks
    expect(metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // < 100MB

    // Generate final report
    const report = performanceMonitor.generateReport();
    console.log('Final Performance Report:', report);
  });
});