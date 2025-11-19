import { SearchService } from '../../../src/services/search/search.service';
import { InMemoryListingRepository } from '../../../src/services/listing/repositories/listing.repo';
import { InMemorySearchHistoryStore } from '../../../src/services/search/search-history.service';
import { ListingPayload } from '../../../src/shared/contracts/listing';

function createListing(overrides: Partial<ListingPayload>): ListingPayload {
  const now = new Date();
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    userId: overrides.userId ?? 'seller',
    title: overrides.title ?? 'default title',
    description: overrides.description ?? 'default description',
    price: overrides.price ?? 100,
    tradeType: overrides.tradeType ?? 'sell',
    keywords: overrides.keywords ?? ['default'],
    aiSummary: overrides.aiSummary,
    remainingViews: overrides.remainingViews ?? 10,
    viewLimit: overrides.viewLimit ?? 10,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 3600_000),
    status: overrides.status ?? 'active',
    totalDeals: overrides.totalDeals ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('SearchService', () => {
  const repo = new InMemoryListingRepository();
  const history = new InMemorySearchHistoryStore();
  const service = new SearchService(repo, history);

  beforeAll(async () => {
    await repo.save(createListing({ id: '1', title: 'iPhone 15 Pro', keywords: ['iphone', 'phone'], totalDeals: 5 }));
    await repo.save(createListing({ id: '2', title: 'MacBook Air', keywords: ['macbook'], totalDeals: 2 }));
  });

  it('returns matching listings ordered by score', async () => {
    const results = await service.search({ keyword: 'iphone', limit: 5, userId: 'buyer' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('iPhone');
  });

  it('records and clears history', async () => {
    await service.recordHistory('user-1', 'mac');
    let historyList = await service.history('user-1');
    expect(historyList[0]).toBe('mac');
    await service.clearHistory('user-1');
    historyList = await service.history('user-1');
    expect(historyList.length).toBe(0);
  });

  it('provides suggestions', async () => {
    await service.recordHistory('user-2', 'switch');
    const suggestions = await service.suggestions('s', 'user-2');
    expect(suggestions.suggestions.length).toBeGreaterThan(0);
  });
});
