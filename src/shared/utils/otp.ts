interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

export class OtpService {
  private readonly store: Map<string, OtpRecord> = new Map();
  constructor(private readonly ttlMs: number = 5 * 60 * 1000, private readonly maxAttempts: number = 5) {}

  issue(key: string, code: string): void {
    this.store.set(key, { code, expiresAt: Date.now() + this.ttlMs, attempts: 0 });
  }

  verify(key: string, code: string): boolean {
    const record = this.store.get(key);
    if (!record) return false;
    if (record.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    if (record.attempts >= this.maxAttempts) {
      return false;
    }
    record.attempts += 1;
    if (record.code !== code) {
      this.store.set(key, record);
      return false;
    }
    this.store.delete(key);
    return true;
  }
}
