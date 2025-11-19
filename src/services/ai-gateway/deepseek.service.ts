import axios, { AxiosInstance } from 'axios';
import { AiGatewayClient, AiEnrichmentResult } from '../../shared/contracts/ai';
import { SecureStore } from './config/secure-store';

const MAX_FAILURES = 3;
const COOLDOWN_MS = 60 * 1000;

function containsSensitive(text: string): boolean {
  return /(wechat|qq|http|:\/\/)/i.test(text);
}

export class DeepSeekService implements AiGatewayClient {
  private readonly client: AxiosInstance;
  private failureCount = 0;
  private openUntil = 0;

  constructor(private readonly store: SecureStore, baseUrl = 'https://api.deepseek.com/v1', client?: AxiosInstance) {
    this.client = client ?? axios.create({ baseURL: baseUrl, timeout: 1500 });
  }

  private ensureCircuit(): void {
    if (Date.now() < this.openUntil) {
      throw new Error('ai gateway circuit open');
    }
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= MAX_FAILURES) {
      this.openUntil = Date.now() + COOLDOWN_MS;
      this.failureCount = 0;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
  }

  async enrichListing(title: string, description: string): Promise<AiEnrichmentResult> {
    this.ensureCircuit();
    try {
      const key = this.store.getDeepSeekKey();
      const response = await this.client.post(
        '/ai/extract-listing',
        { title, description },
        { headers: { Authorization: `Bearer ${key}` } },
      );
      this.onSuccess();
      const data = response.data ?? { keywords: [], summary: '' };
      const summary = containsSensitive(data.summary ?? '') ? '[敏感内容需人工审核]' : data.summary;
      return {
        keywords: data.keywords ?? [],
        summary,
      };
    } catch (error) {
      this.onFailure();
      throw new Error('deepseek request failed');
    }
  }
}
