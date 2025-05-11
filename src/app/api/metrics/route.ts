import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';

// Basic metrics collection
const metrics = {
  requests: 0,
  errors: 0,
  lastRequest: 0,
  performance: {
    avgFCP: 0,
    avgLCP: 0,
    avgCLS: 0,
    avgFID: 0,
    sampleCount: 0,
  },
};

// Update metrics
export function updateMetrics(status: number) {
  metrics.requests++;
  if (status >= 400) {
    metrics.errors++;
  }
  metrics.lastRequest = Date.now();
}

export async function GET() {
  try {
    const metricsOutput = [
      `# HELP hydrolog_requests_total Total number of requests`,
      `# TYPE hydrolog_requests_total counter`,
      `hydrolog_requests_total ${metrics.requests}`,
      `# HELP hydrolog_errors_total Total number of errors`,
      `# TYPE hydrolog_errors_total counter`,
      `hydrolog_errors_total ${metrics.errors}`,
      `# HELP hydrolog_last_request_timestamp_seconds Last request timestamp`,
      `# TYPE hydrolog_last_request_timestamp_seconds gauge`,
      `hydrolog_last_request_timestamp_seconds ${metrics.lastRequest / 1000}`,
      `# HELP hydrolog_fcp_seconds First Contentful Paint average`,
      `# TYPE hydrolog_fcp_seconds gauge`,
      `hydrolog_fcp_seconds ${metrics.performance.avgFCP}`,
      `# HELP hydrolog_lcp_seconds Largest Contentful Paint average`,
      `# TYPE hydrolog_lcp_seconds gauge`,
      `hydrolog_lcp_seconds ${metrics.performance.avgLCP}`,
      `# HELP hydrolog_cls_score Cumulative Layout Shift average`,
      `# TYPE hydrolog_cls_score gauge`,
      `hydrolog_cls_score ${metrics.performance.avgCLS}`,
      `# HELP hydrolog_fid_seconds First Input Delay average`,
      `# TYPE hydrolog_fid_seconds gauge`,
      `hydrolog_fid_seconds ${metrics.performance.avgFID}`,
    ].join('\n');

    logger.debug('Metrics endpoint called');
    return new NextResponse(metricsOutput, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    logger.error('Failed to generate metrics', { error });
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 });
  }
}
