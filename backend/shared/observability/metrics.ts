export class MetricsRegistry {
  private readonly counters = new Map<string, number>();

  increment(name: string, value = 1) {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  snapshot() {
    return Object.fromEntries(this.counters.entries());
  }
}

export const metrics = new MetricsRegistry();
