import { WeChatAuthController } from '../../src/services/auth/wechat.controller';
import { ListingController } from '../../src/services/listing/listing.controller';
import { DealController } from '../../src/services/deal/contact-view.controller';
import { SearchService } from '../../src/services/search/search.service';
import { InMemoryListingRepository } from '../../src/services/listing/repositories/listing.repo';
import { InMemorySearchHistoryStore } from '../../src/services/search/search-history.service';

const auth = new WeChatAuthController();
const listingRepo = new InMemoryListingRepository();
const listing = new ListingController(undefined, listingRepo);
const deal = new DealController();
const search = new SearchService(listingRepo, new InMemorySearchHistoryStore());

describe('H5 user journey', () => {
  it('registers, publishes, searches, and confirms deal', async () => {
    auth.issueState('s', 'n', 'device');
    const login = await auth.startWeChatLogin({ state: 's', nonce: 'n', code: 'wx', device: { deviceId: 'device' } });
    auth.issueOtp('13800000000', '123456');
    await auth.bindPhone({ sessionToken: login.sessionToken, phone: '13800000000', otp: '123456' });

    const created = await listing.publish({ userId: 'seller', title: 'Switch OLED', description: '9成新，带票保修且支持面交', price: 2200, tradeType: 'sell' });
    const results = await search.search({ keyword: 'switch' });
    expect(results.map((r) => r.id)).toContain(created.id);

    await deal.purchaseContact({ postId: created.id, buyerId: 'buyer', sellerId: 'seller', price: 1 });
    const views = await deal.pending(new Date(Date.now() + 86_400_000));
    const target = views[0];
    await deal.confirmDeal({ contactViewId: target.id, buyerId: target.buyerId, payload: '完成交易' });
  });
});

