export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private readonly buckets: Map<string, number[]> = new Map();

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  allow(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const events = this.buckets.get(identifier) ?? [];
    const filtered = events.filter((timestamp) => timestamp >= windowStart);

    if (filtered.length >= this.maxAttempts) {
      this.buckets.set(identifier, filtered);
      return false;
    }

    filtered.push(now);
    this.buckets.set(identifier, filtered);
    return true;
  }
}
