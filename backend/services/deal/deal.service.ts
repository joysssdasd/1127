import crypto from 'crypto';
import dayjs from 'dayjs';
import { DealServiceContract, PurchaseContactInput, ConfirmDealInput, PurchaseContactResult } from '../../shared/contracts/deal';
import { PointsClient } from '../../shared/contracts/points';
import { DomainEventBus } from '../../shared/utils/eventBus';
import { ContactViewRepository, DealStatRepository } from './models/contact-view.entity';
import { ListingRepository } from '../listing/repositories/listing.repo';
import { metrics } from '../../shared/observability/metrics';

const CONTACT_COST = 1;
const CONFIRM_DEADLINE_HOURS = 24;

export class DealService implements DealServiceContract {
  constructor(
    private readonly contactRepo: ContactViewRepository,
    private readonly statRepo: DealStatRepository,
    private readonly listingRepo: ListingRepository,
    private readonly points: PointsClient,
    private readonly events: DomainEventBus,
  ) {}

  async purchaseContact(input: PurchaseContactInput): Promise<PurchaseContactResult> {
    await this.points.deduct(input.buyerId, CONTACT_COST, 'listing.contact', input.postId);
    const token = crypto.randomBytes(8).toString('hex');
    const deadline = dayjs().add(CONFIRM_DEADLINE_HOURS, 'hour').toDate();

    await this.contactRepo.create({
      postId: input.postId,
      sellerId: input.sellerId,
      buyerId: input.buyerId,
      deductedPoints: CONTACT_COST,
      copied: true,
      copiedAt: new Date(),
      confirmStatus: 'pending',
      confirmDeadline: deadline,
      confirmPayload: undefined,
    });

    this.events.emit('deal.contact.purchased', { postId: input.postId, buyerId: input.buyerId });
    metrics.increment('deal.contact.purchased');
    return { contactToken: token, confirmDeadline: deadline };
  }

  async confirmDeal(input: ConfirmDealInput): Promise<void> {
    const record = await this.contactRepo.findById(input.contactViewId);
    if (!record) {
      throw new Error('contact view not found');
    }
    if (record.buyerId !== input.buyerId) {
      throw new Error('permission denied');
    }
    if (record.confirmStatus !== 'pending') {
      return;
    }

    record.confirmStatus = 'confirmed';
    record.confirmPayload = input.payload;
    await this.contactRepo.update(record);
    await this.statRepo.increment(record.postId, record.sellerId);
    await this.listingRepo.incrementDeals(record.postId);
    this.events.emit('deal.confirmed', { postId: record.postId, sellerId: record.sellerId });
    metrics.increment('deal.confirmed');
  }

  async pendingConfirmations(now = new Date()) {
    return this.contactRepo.listPendingConfirmations(now);
  }

  async remindPending(now = new Date()): Promise<number> {
    const due = await this.pendingConfirmations(now);
    for (const record of due) {
      this.events.emit('deal.confirmation.pending', { postId: record.postId, buyerId: record.buyerId, contactViewId: record.id });
      record.confirmDeadline = dayjs(record.confirmDeadline).add(CONFIRM_DEADLINE_HOURS, 'hour').toDate();
      await this.contactRepo.update(record);
    }
    if (due.length > 0) {
      metrics.increment('deal.confirmation.pending', due.length);
    }
    return due.length;
  }
}
