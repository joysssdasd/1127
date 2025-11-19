export interface AiEnrichmentResult {
  keywords: string[];
  summary: string;
}

export interface AiGatewayClient {
  enrichListing(title: string, description: string): Promise<AiEnrichmentResult>;
}

export class MockAiGateway implements AiGatewayClient {
  async enrichListing(title: string, description: string): Promise<AiEnrichmentResult> {
    return {
      keywords: title.split(/\s+/).slice(0, 5).map((w) => w.toLowerCase()),
      summary: description.slice(0, 120),
    };
  }
}
