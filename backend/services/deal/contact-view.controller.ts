import { DealService } from './deal.service';
import {
  ContactViewRepository,
  DealStatRepository,
  InMemoryContactViewRepository,
  InMemoryDealStatRepository,
  SupabaseContactViewRepository,
  SupabaseDealStatRepository,
} from './models/contact-view.entity';
import { InMemoryListingRepository, ListingRepository } from '../listing/repositories/listing.repo';
import { SupabaseListingRepository } from '../listing/repositories/listing.supabase';
import { createPointsClient } from '../../shared/contracts/points';
import { DomainEventBus } from '../../shared/utils/eventBus';
import { DealServiceContract, PurchaseContactInput, ConfirmDealInput } from '../../shared/contracts/deal';

function useSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL));
}

function createContactRepo(): ContactViewRepository {
  return useSupabase() ? new SupabaseContactViewRepository() : new InMemoryContactViewRepository();
}

function createDealStatRepo(): DealStatRepository {
  return useSupabase() ? new SupabaseDealStatRepository() : new InMemoryDealStatRepository();
}

function createListingRepo(): ListingRepository {
  return useSupabase() ? new SupabaseListingRepository() : new InMemoryListingRepository();
}

export class DealController {
  private readonly service: DealServiceContract;

  constructor(service?: DealServiceContract) {
    this.service =
      service ??
      new DealService(createContactRepo(), createDealStatRepo(), createListingRepo(), createPointsClient(), new DomainEventBus());
  }

  purchaseContact(payload: PurchaseContactInput) {
    return this.service.purchaseContact(payload);
  }

  confirmDeal(payload: ConfirmDealInput) {
    return this.service.confirmDeal(payload);
  }

  remind(now?: Date) {
    return this.service.remindPending(now);
  }

  pending(now?: Date) {
    return (this.service as DealService).pendingConfirmations(now);
  }
}
