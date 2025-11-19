interface StateRecord {
  nonce: string;
  deviceId: string;
  createdAt: number;
}

export class AuthStateStore {
  private readonly timeoutMs: number;
  private readonly states: Map<string, StateRecord> = new Map();

  constructor(timeoutMs = 5 * 60 * 1000) {
    this.timeoutMs = timeoutMs;
  }

  issue(state: string, nonce: string, deviceId: string): void {
    this.states.set(state, { nonce, deviceId, createdAt: Date.now() });
  }

  verify(state: string, nonce: string): string | null {
    const record = this.states.get(state);
    if (!record) return null;
    this.states.delete(state);
    if (record.nonce !== nonce) return null;
    if (Date.now() - record.createdAt > this.timeoutMs) return null;
    return record.deviceId;
  }
}
