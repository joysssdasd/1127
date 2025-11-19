import { metrics } from '../../src/shared/observability/metrics';

describe('metrics registry', () => {
  it('increments counters', () => {
    metrics.increment('test.metric');
    metrics.increment('test.metric', 2);
    expect(metrics.snapshot()['test.metric']).toBeGreaterThanOrEqual(3);
  });
});
