import { ListingService } from '../../../src/services/listing/listing.service';
import { InMemoryListingRepository } from '../../../src/services/listing/repositories/listing.repo';
import { DomainEventBus } from '../../../src/shared/utils/eventBus';
import { PointsClient } from '../../../src/shared/contracts/points';
import { AiGatewayClient } from '../../../src/shared/contracts/ai';

class MockPoints implements PointsClient {
  public calls: Array<{ userId: string; amount: number; reason: string }> = [];
  async deduct(userId: string, amount: number, reason: string): Promise<void> {
    this.calls.push({ userId, amount, reason });
  }
}

class MockAi implements AiGatewayClient {
  async enrichListing(): Promise<{ keywords: string[]; summary: string }> {
    return { keywords: ['ai'], summary: 'ai summary' };
  }
}

describe('ListingService', () => {
  const repo = new InMemoryListingRepository();
  const points = new MockPoints();
  const ai = new MockAi();
  const events = new DomainEventBus();
  const service = new ListingService(repo, points, ai, events);

  it('publishes listing with ai keywords and deducts points', async () => {
    const listing = await service.publish({
      userId: 'seller-1',
      title: 'iPhone 15 Pro',
      description: 'Selling iPhone 15 Pro brand new sealed package',
      price: 900,
      tradeType: 'sell',
      aiAssist: true,
    });

    expect(points.calls.at(-1)).toEqual({ userId: 'seller-1', amount: 10, reason: 'listing.publish' });
    expect(listing.remainingViews).toBe(10);
    expect(listing.status).toBe('active');
    expect(listing.keywords).toContain('ai');
    expect(listing.aiSummary).toBe('ai summary');
  });

  it('republication resets counters and re-deducts points', async () => {
    const original = await service.publish({
      userId: 'seller-2',
      title: 'Macbook Air',
      description: 'Latest Macbook Air M3 in stock',
      price: 1200,
      tradeType: 'sell',
    });

    original.remainingViews = 0;
    await repo.save(original);

    const relisted = await service.republish(original.id, 'seller-2');
    expect(relisted.remainingViews).toBe(10);
    expect(points.calls.filter((c) => c.reason === 'listing.republish').length).toBe(1);
  });

  it('expires listings that passed deadline or no views left', async () => {
    const listing = await service.publish({
      userId: 'seller-3',
      title: 'Nintendo Switch',
      description: 'Switch OLED almost new',
      price: 300,
      tradeType: 'sell',
    });
    listing.expiresAt = new Date(Date.now() - 1000);
    await repo.save(listing);

    const expiredCount = await service.expireOverdue(new Date());
    expect(expiredCount).toBeGreaterThanOrEqual(1);
    const updated = await repo.findById(listing.id);
    expect(updated?.status).toBe('expired');
  });
});
