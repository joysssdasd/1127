import { ListingController } from '../../backend/services/listing/listing.controller';
import { DealController } from '../../backend/services/deal/contact-view.controller';
import { SearchService } from '../../backend/services/search/search.service';
import { InMemoryListingRepository } from '../../backend/services/listing/repositories/listing.repo';
import { InMemorySearchHistoryStore } from '../../backend/services/search/search-history.service';

const listingRepo = new InMemoryListingRepository();
const listing = new ListingController(undefined, listingRepo);
const deal = new DealController();
const search = new SearchService(listingRepo, new InMemorySearchHistoryStore());

describe('User journey without UI', () => {
  it('publishes, searches, purchases contact and confirms deal', async () => {
    const created = await listing.publish({ userId: 'seller', title: 'Switch OLED', description: 'Switch OLED 九成新，含发票，可当面交易', price: 2200, tradeType: 'sell' });
    const results = await search.search({ keyword: 'switch' });
    expect(results.map((r) => r.id)).toContain(created.id);

    await deal.purchaseContact({ postId: created.id, buyerId: 'buyer', sellerId: 'seller', price: 1 });
    const views = await deal.pending(new Date(Date.now() + 86_400_000));
    const target = views[0];
    await deal.confirmDeal({ contactViewId: target.id, buyerId: target.buyerId, payload: '完成交易' });
  });
});
