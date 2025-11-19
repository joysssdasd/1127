import { DeepSeekService } from '../../../backend/services/ai-gateway/deepseek.service';
import { SecureStore } from '../../../backend/services/ai-gateway/config/secure-store';
import { AxiosInstance } from 'axios';

class FakeAxios implements AxiosInstance {
  defaults: any = {};
  interceptors: any = { request: { use: () => {} }, response: { use: () => {} } };
  constructor(private readonly shouldFail = false) {}
  async post() {
    if (this.shouldFail) {
      throw new Error('network error');
    }
    return { data: { keywords: ['iphone'], summary: 'safe summary' } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

describe('DeepSeekService', () => {
  it('returns enrichment result on success', async () => {
    const service = new DeepSeekService(new SecureStore({ DEEPSEEK_API_KEY: 'test' }), 'http://fake', new FakeAxios());
    const result = await service.enrichListing('title', 'desc');
    expect(result.keywords).toContain('iphone');
  });

  it('opens circuit after failures', async () => {
    const service = new DeepSeekService(new SecureStore({ DEEPSEEK_API_KEY: 'test' }), 'http://fake', new FakeAxios(true));
    await expect(service.enrichListing('title', 'desc')).rejects.toThrow('deepseek request failed');
    await expect(service.enrichListing('title', 'desc')).rejects.toThrow('deepseek request failed');
    await expect(service.enrichListing('title', 'desc')).rejects.toThrow('deepseek request failed');
    await expect(service.enrichListing('title', 'desc')).rejects.toThrow('ai gateway circuit open');
  });
});
