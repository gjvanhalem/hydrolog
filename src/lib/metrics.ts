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

export function updateMetrics(status: number) {
  metrics.requests++;
  if (status >= 400) {
    metrics.errors++;
  }
  metrics.lastRequest = Date.now();
}

export function getMetrics() {
  return metrics;
}
