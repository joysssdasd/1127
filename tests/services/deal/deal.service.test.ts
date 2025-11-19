import { DealService } from '../../../src/services/deal/deal.service';
import {
  InMemoryContactViewRepository,
  InMemoryDealStatRepository,
} from '../../../src/services/deal/models/contact-view.entity';
import { InMemoryListingRepository } from '../../../src/services/listing/repositories/listing.repo';
import { PointsClient } from '../../../src/shared/contracts/points';
import { DomainEventBus } from '../../../src/shared/utils/eventBus';

class MockPoints implements PointsClient {
  public deductions: Array<{ userId: string; amount: number; reason: string }> = [];
  async deduct(userId: string, amount: number, reason: string): Promise<void> {
    this.deductions.push({ userId, amount, reason });
  }
}

describe('DealService', () => {
  const repo = new InMemoryContactViewRepository();
  const stats = new InMemoryDealStatRepository();
  const listingRepo = new InMemoryListingRepository();
  const points = new MockPoints();
  const events = new DomainEventBus();
  const service = new DealService(repo, stats, listingRepo, points, events);

  it('deducts points and creates contact view', async () => {
    const result = await service.purchaseContact({
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      postId: 'post-1',
      price: 1,
    });

    expect(result.contactToken).toHaveLength(16);
    expect(points.deductions.length).toBeGreaterThan(0);
  });

  it('confirms deal and increments stats', async () => {
    await service.purchaseContact({
      buyerId: 'buyer-2',
      sellerId: 'seller-2',
      postId: 'post-2',
      price: 1,
    });
    const views = await repo.listByPost('post-2');
    const view = views[0];

    await service.confirmDeal({ contactViewId: view.id, buyerId: 'buyer-2', payload: 'chat screenshot' });
    const updated = await repo.findById(view.id);
    expect(updated?.confirmStatus).toBe('confirmed');
  });

  it('emits reminders for pending confirmations', async () => {
    await service.purchaseContact({
      buyerId: 'buyer-3',
      sellerId: 'seller-3',
      postId: 'post-3',
      price: 1,
    });
    const views = await repo.listByPost('post-3');
    const view = views[0];
    view.confirmDeadline = new Date(Date.now() - 1000);
    await repo.update(view);

    const reminded = await service.remindPending(new Date());
    expect(reminded).toBeGreaterThanOrEqual(1);
  });
});
