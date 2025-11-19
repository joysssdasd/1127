import crypto from 'crypto';
import dayjs from 'dayjs';
import { ListingPayload, ListingServiceContract, CreateListingInput } from '../../shared/contracts/listing';
import { PointsClient } from '../../shared/contracts/points';
import { AiGatewayClient } from '../../shared/contracts/ai';
import { DomainEventBus } from '../../shared/utils/eventBus';
import { ListingRepository } from './repositories/listing.repo';
import { validateCreateListingInput } from './validators';
import { metrics } from '../../shared/observability/metrics';

const PUBLISH_COST = 10;
const VIEW_LIMIT = 10;
const LIFETIME_HOURS = 72;

export class ListingService implements ListingServiceContract {
  constructor(
    private readonly repo: ListingRepository,
    private readonly points: PointsClient,
    private readonly ai: AiGatewayClient,
    private readonly events: DomainEventBus,
  ) {}

  async publish(input: CreateListingInput): Promise<ListingPayload> {
    validateCreateListingInput(input);

    const id = crypto.randomUUID();
    const expireAt = dayjs().add(LIFETIME_HOURS, 'hour').toDate();
    let keywords = input.keywords ?? [];
    let aiSummary: string | undefined;

    if (input.aiAssist) {
      try {
        const enriched = await this.ai.enrichListing(input.title, input.description);
        keywords = Array.from(new Set([...(input.keywords ?? []), ...enriched.keywords]));
        aiSummary = enriched.summary;
      } catch (error) {
        // degrade gracefully
      }
    }

    await this.points.deduct(input.userId, PUBLISH_COST, 'listing.publish', id);

    const now = new Date();
    const record = await this.repo.save({
      id,
      userId: input.userId,
      title: input.title,
      description: input.description,
      price: input.price,
      tradeType: input.tradeType,
      keywords,
      aiSummary,
      remainingViews: VIEW_LIMIT,
      viewLimit: VIEW_LIMIT,
      expiresAt: expireAt,
      status: 'active',
      totalDeals: 0,
      createdAt: now,
      updatedAt: now,
    } as ListingPayload);

    this.events.emit('listing.published', { id: record.id, userId: record.userId });
    metrics.increment('listing.published');
    return record;
  }

  async republish(id: string, userId: string): Promise<ListingPayload> {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new Error('listing not found');
    }
    if (listing.userId !== userId) {
      throw new Error('permission denied');
    }

    await this.points.deduct(userId, PUBLISH_COST, 'listing.republish', id);
    listing.status = 'active';
    listing.remainingViews = VIEW_LIMIT;
    listing.viewLimit = VIEW_LIMIT;
    listing.expiresAt = dayjs().add(LIFETIME_HOURS, 'hour').toDate();

    const saved = await this.repo.save(listing);
    this.events.emit('listing.republished', { id: saved.id, userId: saved.userId });
    metrics.increment('listing.republished');
    return saved;
  }

  async expireOverdue(now = new Date()): Promise<number> {
    const active = await this.repo.listActive();
    let expired = 0;
    for (const listing of active) {
      if (listing.expiresAt <= now || listing.remainingViews <= 0) {
        listing.status = 'expired';
        await this.repo.save(listing);
        this.events.emit('listing.expired', { id: listing.id, userId: listing.userId });
        expired += 1;
        metrics.increment('listing.expired');
      }
    }
    return expired;
  }
}
