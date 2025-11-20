import { ListingController } from '../../backend/services/listing/listing.controller';
import { DealController } from '../../backend/services/deal/contact-view.controller';
import { SmsPasswordAuthController } from '../../backend/services/auth/sms.controller';
import { LedgerService, RechargeService } from '../../backend/services/points/ledger.service';
import { createLedgerRepository, createRechargeRepository } from '../../backend/services/points/models/repositories';
import { SearchController } from '../../backend/services/search/search.controller';
import { getUserRepository } from './repositories';

const listingController = new ListingController();
const dealController = new DealController();
const authController = new SmsPasswordAuthController({ repository: getUserRepository() });
const ledgerService = new LedgerService(createLedgerRepository());
const rechargeService = new RechargeService(createRechargeRepository(), ledgerService);
const searchController = new SearchController();

export const controllers = {
  listing: listingController,
  deal: dealController,
  auth: authController,
  ledger: ledgerService,
  recharge: rechargeService,
  search: searchController,
};
