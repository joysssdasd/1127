export interface SearchQuery {
  keyword: string;
  userId?: string;
  limit?: number;
}

export interface ListingSearchResult {
  id: string;
  title: string;
  price: number;
  totalDeals: number;
  remainingViews: number;
}

export interface SuggestionResult {
  suggestions: string[];
}

export interface SearchServiceContract {
  search(payload: SearchQuery): Promise<ListingSearchResult[]>;
  recordHistory(userId: string, keyword: string): Promise<void>;
  history(userId: string): Promise<string[]>;
  clearHistory(userId: string): Promise<void>;
  suggestions(prefix: string, userId?: string): Promise<SuggestionResult>;
}
