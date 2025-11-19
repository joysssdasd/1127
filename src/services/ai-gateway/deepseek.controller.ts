import { SecureStore } from './config/secure-store';
import { DeepSeekService } from './deepseek.service';

export class DeepSeekController {
  private readonly service: DeepSeekService;

  constructor(service?: DeepSeekService) {
    this.service = service ?? new DeepSeekService(new SecureStore());
  }

  enrich(title: string, description: string) {
    return this.service.enrichListing(title, description);
  }
}
