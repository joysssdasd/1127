import crypto from 'crypto';

interface SessionRecord<T> {
  payload: T;
  expiresAt: number;
}

export class EphemeralSessionStore<T> {
  private readonly store: Map<string, SessionRecord<T>> = new Map();

  constructor(private readonly ttlMs: number) {}

  create(payload: T): string {
    const token = crypto.randomBytes(24).toString('hex');
    this.store.set(token, { payload, expiresAt: Date.now() + this.ttlMs });
    return token;
  }

  consume(token: string): T | null {
    const record = this.store.get(token);
    if (!record) {
      return null;
    }
    this.store.delete(token);
    if (record.expiresAt < Date.now()) {
      return null;
    }
    return record.payload;
  }
}
