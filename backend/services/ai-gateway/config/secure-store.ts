export class SecureStore {
  constructor(private readonly secrets: Record<string, string | undefined> = process.env) {}

  getDeepSeekKey(): string {
    const key = this.secrets.DEEPSEEK_API_KEY ?? 'sk-590bf6c824164c97bce54f28f103428a';
    if (!key) {
      throw new Error('deepseek key missing');
    }
    return key;
  }
}
