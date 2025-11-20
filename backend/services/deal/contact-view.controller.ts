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
import { createUserRepository } from '../../shared/domain/userRepository';

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
  private readonly contactRepo: ContactViewRepository;

  constructor(service?: DealServiceContract, contactRepo?: ContactViewRepository) {
    if (service && contactRepo) {
      this.service = service;
      this.contactRepo = contactRepo;
      return;
    }

    if (service && !contactRepo) {
      throw new Error('ContactViewRepository must be provided when injecting a custom service');
    }

    const resolvedContactRepo = contactRepo ?? createContactRepo();
    this.contactRepo = resolvedContactRepo;
    this.service = new DealService(
      resolvedContactRepo,
      createDealStatRepo(),
      createListingRepo(),
      createPointsClient(),
      new DomainEventBus(),
      createUserRepository(),
    );
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

  listPurchases(buyerId: string) {
    return this.contactRepo.listByBuyer(buyerId);
  }
}
