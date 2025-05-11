import { logger } from './logger';

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputTiming extends PerformanceEntry {
  processingStart: number;
}

interface PerformanceMetrics {
  FCP: number | null;
  LCP: number | null;
  CLS: number | null;
  FID: number | null;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    FCP: null,
    LCP: null,
    CLS: null,
    FID: null,
  };
  private observers: PerformanceObserver[] = [];

  constructor() {
    // Only initialize if we're in the browser and PerformanceObserver is available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // First Contentful Paint
    this.observeFCP();

    // Largest Contentful Paint
    this.observeLCP();

    // Cumulative Layout Shift
    this.observeCLS();

    // First Input Delay
    this.observeFID();
  }

  private observeFCP() {
    const entryHandler = (list: PerformanceObserverEntryList) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.FCP = entry.startTime;
          this.logMetric('FCP', entry.startTime);
        }
      }
    };

    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ entryTypes: ['paint'] });
  }

  private observeLCP() {
    const entryHandler = (list: PerformanceObserverEntryList) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.metrics.LCP = entry.startTime;
          this.logMetric('LCP', entry.startTime);
        }
      }
    };

    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }
  private observeCLS() {
    let clsValue = 0;
    const entryHandler = (list: PerformanceObserverEntryList) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'layout-shift') {
          const layoutShift = entry as LayoutShift;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
            this.metrics.CLS = clsValue;
            this.logMetric('CLS', clsValue);
          }
        }
      }
    };

    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private observeFID() {
    const entryHandler = (list: PerformanceObserverEntryList) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'first-input') {
          const firstInput = entry as FirstInputTiming;
          if (firstInput.processingStart) {
            this.metrics.FID = firstInput.processingStart - firstInput.startTime;
            this.logMetric('FID', this.metrics.FID);
          }
        }
      }
    };

    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ entryTypes: ['first-input'] });
  }

  private logMetric(name: string, value: number) {
    logger.info(`Performance metric: ${name}`, {
      metric: name,
      value,
      path: window.location.pathname,
    });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

export const performanceMonitor = typeof window !== 'undefined' 
  ? new PerformanceMonitor() 
  : null;
