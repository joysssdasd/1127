import { DealService } from '../../../backend/services/deal/deal.service';
import {
  InMemoryContactViewRepository,
  InMemoryDealStatRepository,
} from '../../../backend/services/deal/models/contact-view.entity';
import { InMemoryListingRepository } from '../../../backend/services/listing/repositories/listing.repo';
import { PointsClient } from '../../../backend/shared/contracts/points';
import { DomainEventBus } from '../../../backend/shared/utils/eventBus';
import { InMemoryUserRepository } from '../../../backend/shared/domain/userRepository';

class MockPoints implements PointsClient {
  public deductions: Array<{ userId: string; amount: number; reason: string }> = [];
  async deduct(userId: string, amount: number, reason: string): Promise<void> {
    this.deductions.push({ userId, amount, reason });
  }
}

describe('DealService', () => {
  let repo: InMemoryContactViewRepository;
  let stats: InMemoryDealStatRepository;
  let listingRepo: InMemoryListingRepository;
  let points: MockPoints;
  let events: DomainEventBus;
  let users: InMemoryUserRepository;
  let service: DealService;
  let sellerId: string;

  beforeEach(async () => {
    repo = new InMemoryContactViewRepository();
    stats = new InMemoryDealStatRepository();
    listingRepo = new InMemoryListingRepository();
    points = new MockPoints();
    events = new DomainEventBus();
    users = new InMemoryUserRepository();
    const seller = await users.createWithPhone('13800000000', 'hash', 'wx-contact');
    sellerId = seller.id;
    service = new DealService(repo, stats, listingRepo, points, events, users);
  });

  it('deducts points and returns seller contact', async () => {
    const result = await service.purchaseContact({
      buyerId: 'buyer-1',
      sellerId,
      postId: 'post-1',
      price: 1,
    });

    expect(result.contactToken).toHaveLength(16);
    expect(result.contact).toBe('wx-contact');
    expect(points.deductions.length).toBeGreaterThan(0);
  });

  it('confirms deal and increments stats', async () => {
    await service.purchaseContact({
      buyerId: 'buyer-2',
      sellerId,
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
      sellerId,
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
