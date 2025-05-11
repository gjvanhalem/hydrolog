import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getMetrics } from '@/lib/metrics';

export async function GET(
  request: NextRequest
) {
  const startTime = Date.now();
  
  try {
    const currentMetrics = await getMetrics();
    
    // Validate metrics
    if (!currentMetrics || typeof currentMetrics.requests !== 'number') {
      throw new Error('Invalid metrics data');
    }

    const metricsOutput = generateMetricsOutput(currentMetrics);

    logger.debug('Metrics endpoint called', {
      responseTime: Date.now() - startTime
    });

    return new NextResponse(metricsOutput, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-cache, max-age=0',
      },
    });
  } catch (error) {
    logger.error('Failed to generate metrics', { 
      error,
      responseTime: Date.now() - startTime 
    });
    return NextResponse.json(
      { error: 'Failed to generate metrics' }, 
      { status: 500 }
    );
  }
}

function generateMetricsOutput(metrics: any) {
  return [
    `# HELP hydrolog_requests_total Total number of requests`,
    `# TYPE hydrolog_requests_total counter`,
    `hydrolog_requests_total ${metrics.requests}`,
    // ... rest of metrics
  ].join('\n');
}
