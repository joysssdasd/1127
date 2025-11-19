import { SearchController } from '../../../../../services/search/search.controller';
import { ListingSearchResult } from '../../../../../shared/contracts/search';

const controller = new SearchController();

export async function searchListings(keyword: string, userId?: string): Promise<ListingSearchResult[]> {
  return controller.search({ keyword, userId });
}

export function fetchHistory(userId: string) {
  return controller.history(userId);
}

export function clearHistory(userId: string) {
  return controller.clearHistory(userId);
}

export function fetchSuggestions(prefix: string, userId?: string) {
  return controller.suggestions(prefix, userId);
}
