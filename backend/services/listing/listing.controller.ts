import { ListingService } from './listing.service';
import { InMemoryListingRepository, ListingRepository } from './repositories/listing.repo';
import { SupabaseListingRepository } from './repositories/listing.supabase';
import { createPointsClient } from '../../shared/contracts/points';
import { MockAiGateway } from '../../shared/contracts/ai';
import { DomainEventBus } from '../../shared/utils/eventBus';
import { ListingServiceContract, CreateListingInput, ListingPayload } from '../../shared/contracts/listing';

function resolveListingRepository(): ListingRepository {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)) {
    return new SupabaseListingRepository();
  }
  return new InMemoryListingRepository();
}

export class ListingController {
  private readonly service: ListingServiceContract;
  private readonly repo: ListingRepository;

  constructor(service?: ListingServiceContract, repo?: ListingRepository) {
    this.repo = repo ?? resolveListingRepository();
    this.service = service ?? new ListingService(this.repo, createPointsClient(), new MockAiGateway(), new DomainEventBus());
  }

  publish(payload: CreateListingInput) {
    return this.service.publish(payload);
  }

  republish(id: string, userId: string) {
    return this.service.republish(id, userId);
  }

  expire(now?: Date) {
    return this.service.expireOverdue(now);
  }

  list(): Promise<ListingPayload[]> {
    return this.repo.listActive();
  }

  findById(id: string) {
    return this.repo.findById(id);
  }
}
