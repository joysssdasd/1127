import { SearchController } from '../../../../../services/search/search.controller';
import type { ListingSearchResult, SuggestionResult } from '../../../../../shared/contracts/search';

const controller = new SearchController();

export async function searchListings(keyword: string, userId?: string): Promise<ListingSearchResult[]> {
  const payload = userId ? { keyword, userId } : { keyword };
  return controller.search(payload);
}

export function fetchHistory(userId: string) {
  return controller.history(userId);
}

export function clearHistory(userId: string) {
  return controller.clearHistory(userId);
}

export function fetchSuggestions(prefix: string, userId?: string): Promise<SuggestionResult> {
  return controller.suggestions(prefix, userId);
}
