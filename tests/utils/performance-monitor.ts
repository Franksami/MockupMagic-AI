/**
 * Performance Monitoring Utilities for MockupMagic AI
 * Phase 4: Comprehensive performance validation utilities
 */

import { Page, BrowserContext } from '@playwright/test';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  paintTime: number;
  layoutShiftScore: number;
  longTasks: number;
  networkRequests: number;
  jsHeapSize: number;
  domNodes: number;
}

export interface ScrollPerformanceMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  droppedFrames: number;
  scrollJank: number;
  totalScrollTime: number;
}

export class PerformanceMonitor {
  private page: Page;
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start monitoring performance metrics
   */
  async startMonitoring(): Promise<void> {
    this.isMonitoring = true;
    this.metrics = [];

    // Inject performance monitoring script
    await this.page.addInitScript(() => {
      (window as any).__performanceMetrics = [];

      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              (window as any).__performanceMetrics.push({
                type: 'longTask',
                duration: entry.duration,
                timestamp: entry.startTime
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }

      // Monitor layout shifts
      if ('PerformanceObserver' in window) {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              (window as any).__performanceMetrics.push({
                type: 'layoutShift',
                value: (entry as any).value,
                timestamp: entry.startTime
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
    });
  }

  /**
   * Stop monitoring and return collected metrics
   */
  async stopMonitoring(): Promise<PerformanceMetrics[]> {
    this.isMonitoring = false;
    return this.metrics;
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const metrics = await this.page.evaluate(() => {
      const perf = performance as any;
      const memory = perf.memory || {};
      const navigation = perf.getEntriesByType('navigation')[0] as any;

      // Calculate FPS from frame timing
      let fps = 60;
      if (typeof window.requestAnimationFrame === 'function') {
        let frameCount = 0;
        const startTime = performance.now();

        const countFrames = () => {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          }
        };
        requestAnimationFrame(countFrames);

        // Wait for measurement
        setTimeout(() => {
          fps = frameCount;
        }, 1000);
      }

      return {
        fps,
        memoryUsage: memory.usedJSHeapSize || 0,
        renderTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        paintTime: perf.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        layoutShiftScore: (window as any).__performanceMetrics?.filter((m: any) => m.type === 'layoutShift')
          .reduce((acc: number, m: any) => acc + m.value, 0) || 0,
        longTasks: (window as any).__performanceMetrics?.filter((m: any) => m.type === 'longTask').length || 0,
        networkRequests: perf.getEntriesByType('resource').length,
        jsHeapSize: memory.jsHeapSizeLimit || 0,
        domNodes: document.getElementsByTagName('*').length
      };
    });

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Monitor virtual scrolling performance
   */
  async monitorVirtualScrolling(
    scrollElement: string,
    duration: number = 5000
  ): Promise<ScrollPerformanceMetrics> {
    return await this.page.evaluate(async ({ selector, duration }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element ${selector} not found`);

      const metrics = {
        frames: [] as number[],
        droppedFrames: 0,
        scrollPositions: [] as number[],
        timestamps: [] as number[]
      };

      let lastFrameTime = performance.now();
      let animationId: number;

      const measureFrame = () => {
        const currentTime = performance.now();
        const frameDuration = currentTime - lastFrameTime;

        // Calculate FPS for this frame
        const fps = 1000 / frameDuration;
        metrics.frames.push(fps);

        // Detect dropped frames (below 30 FPS)
        if (fps < 30) {
          metrics.droppedFrames++;
        }

        metrics.scrollPositions.push(element.scrollTop);
        metrics.timestamps.push(currentTime);

        lastFrameTime = currentTime;
        animationId = requestAnimationFrame(measureFrame);
      };

      // Start monitoring
      animationId = requestAnimationFrame(measureFrame);

      // Perform scroll test
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollStep = scrollHeight / 100;
      const scrollInterval = duration / 100;

      for (let i = 0; i <= 100; i++) {
        element.scrollTop = scrollStep * i;
        await new Promise(resolve => setTimeout(resolve, scrollInterval));
      }

      // Stop monitoring
      cancelAnimationFrame(animationId);

      // Calculate metrics
      const averageFPS = metrics.frames.reduce((a, b) => a + b, 0) / metrics.frames.length;
      const minFPS = Math.min(...metrics.frames);
      const maxFPS = Math.max(...metrics.frames);

      // Calculate scroll jank (variance in scroll speed)
      const scrollSpeeds = [];
      for (let i = 1; i < metrics.scrollPositions.length; i++) {
        const distance = Math.abs(metrics.scrollPositions[i] - metrics.scrollPositions[i - 1]);
        const time = metrics.timestamps[i] - metrics.timestamps[i - 1];
        scrollSpeeds.push(distance / time);
      }

      const avgSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
      const scrollJank = scrollSpeeds.reduce((acc, speed) =>
        acc + Math.abs(speed - avgSpeed), 0) / scrollSpeeds.length;

      return {
        averageFPS,
        minFPS,
        maxFPS,
        droppedFrames: metrics.droppedFrames,
        scrollJank,
        totalScrollTime: metrics.timestamps[metrics.timestamps.length - 1] - metrics.timestamps[0]
      };
    }, { selector: scrollElement, duration });
  }

  /**
   * Monitor animation performance
   */
  async monitorAnimation(
    animationTrigger: () => Promise<void>,
    duration: number = 3000
  ): Promise<{ averageFPS: number; gpuAccelerated: boolean }> {
    // Check for GPU acceleration
    const gpuAccelerated = await this.page.evaluate(() => {
      const element = document.createElement('div');
      element.style.transform = 'translateZ(0)';
      document.body.appendChild(element);
      const computed = window.getComputedStyle(element);
      const hasGPU = computed.transform !== 'none';
      document.body.removeChild(element);
      return hasGPU;
    });

    // Start FPS monitoring
    const startTime = Date.now();
    const fpsReadings: number[] = [];

    await this.page.evaluate(() => {
      (window as any).__fpsMonitor = {
        frames: 0,
        startTime: performance.now()
      };

      const countFrame = () => {
        (window as any).__fpsMonitor.frames++;
        if (performance.now() - (window as any).__fpsMonitor.startTime < 3000) {
          requestAnimationFrame(countFrame);
        }
      };
      requestAnimationFrame(countFrame);
    });

    // Trigger animation
    await animationTrigger();

    // Wait for animation duration
    await this.page.waitForTimeout(duration);

    // Collect FPS data
    const fps = await this.page.evaluate(() => {
      const monitor = (window as any).__fpsMonitor;
      const elapsed = (performance.now() - monitor.startTime) / 1000;
      return monitor.frames / elapsed;
    });

    return {
      averageFPS: fps,
      gpuAccelerated
    };
  }

  /**
   * Measure memory usage during operation
   */
  async measureMemoryUsage(
    operation: () => Promise<void>
  ): Promise<{ before: number; after: number; delta: number }> {
    const before = await this.page.evaluate(() => {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize : 0;
    });

    await operation();

    // Force garbage collection if available
    await this.page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    const after = await this.page.evaluate(() => {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize : 0;
    });

    return {
      before,
      after,
      delta: after - before
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No metrics collected';
    }

    const avgMetrics = this.metrics.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        acc[key] = (acc[key] || 0) + (metric as any)[key];
      });
      return acc;
    }, {} as any);

    Object.keys(avgMetrics).forEach(key => {
      avgMetrics[key] = avgMetrics[key] / this.metrics.length;
    });

    return `
Performance Report:
==================
Average FPS: ${avgMetrics.fps.toFixed(2)}
Memory Usage: ${(avgMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
Render Time: ${avgMetrics.renderTime.toFixed(2)} ms
Paint Time: ${avgMetrics.paintTime.toFixed(2)} ms
Layout Shift Score: ${avgMetrics.layoutShiftScore.toFixed(4)}
Long Tasks: ${avgMetrics.longTasks}
Network Requests: ${avgMetrics.networkRequests}
DOM Nodes: ${avgMetrics.domNodes}
    `;
  }
}