import { SearchService } from './search.service';
import { InMemoryListingRepository, ListingRepository } from '../listing/repositories/listing.repo';
import { SupabaseListingRepository } from '../listing/repositories/listing.supabase';
import { createSearchHistoryStore } from './search-history.service';
import { SearchQuery } from '../../shared/contracts/search';

function createListingRepository(): ListingRepository {
  return process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)
    ? new SupabaseListingRepository()
    : new InMemoryListingRepository();
}

export class SearchController {
  private readonly service: SearchService;

  constructor(service?: SearchService) {
    this.service = service ?? new SearchService(createListingRepository(), createSearchHistoryStore());
  }

  search(payload: SearchQuery) {
    return this.service.search(payload);
  }

  history(userId: string) {
    return this.service.history(userId);
  }

  clearHistory(userId: string) {
    return this.service.clearHistory(userId);
  }

  suggestions(prefix: string, userId?: string) {
    return this.service.suggestions(prefix, userId);
  }
}
