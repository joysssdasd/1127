import { ListingRepository } from '../listing/repositories/listing.repo';
import { SearchServiceContract, SearchQuery, ListingSearchResult, SuggestionResult } from '../../shared/contracts/search';
import { SearchHistoryStore } from './search-history.service';
import { buildSearchResults } from './query-builders/listingQueryBuilder';

const DEFAULT_SUGGESTIONS = ['iPhone', 'MacBook', 'Switch', 'GPU', '租号'];

export class SearchService implements SearchServiceContract {
  constructor(private readonly repo: ListingRepository, private readonly historyService: SearchHistoryStore) {}

  async search(payload: SearchQuery): Promise<ListingSearchResult[]> {
    const listings = await this.repo.listActive();
    const results = buildSearchResults(payload.keyword, listings);
    const limit = payload.limit ?? 20;
    if (payload.userId) {
      await this.historyService.record(payload.userId, payload.keyword);
    }
    return results.slice(0, limit);
  }

  async recordHistory(userId: string, keyword: string): Promise<void> {
    await this.historyService.record(userId, keyword);
  }

  async history(userId: string): Promise<string[]> {
    return this.historyService.history(userId);
  }

  async clearHistory(userId: string): Promise<void> {
    await this.historyService.clear(userId);
  }

  async suggestions(prefix: string, userId?: string): Promise<SuggestionResult> {
    const normalized = prefix.trim().toLowerCase();
    const history = userId ? await this.historyService.history(userId) : [];
    const combined = new Set<string>();
    for (const suggestion of DEFAULT_SUGGESTIONS) {
      if (suggestion.toLowerCase().startsWith(normalized)) {
        combined.add(suggestion);
      }
    }
    for (const entry of history) {
      if (entry.toLowerCase().startsWith(normalized)) {
        combined.add(entry);
      }
    }
    return { suggestions: [...combined].slice(0, 10) };
  }
}
