import crypto from 'crypto';
import { ListingPayload } from '../../../shared/contracts/listing';

export interface ListingRepository {
  save(payload: Omit<ListingPayload, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date }): Promise<ListingPayload>;
  findById(id: string): Promise<ListingPayload | undefined>;
  listActive(): Promise<ListingPayload[]>;
  incrementDeals(id: string): Promise<ListingPayload | undefined>;
}

export class InMemoryListingRepository implements ListingRepository {
  private readonly listings: Map<string, ListingPayload> = new Map();

  async save(payload: Omit<ListingPayload, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date }): Promise<ListingPayload> {
    const now = new Date();
    const id = payload.id ?? crypto.randomUUID();
    const record: ListingPayload = {
      ...payload,
      id,
      createdAt: payload.id ? payload.createdAt ?? now : now,
      updatedAt: now,
      totalDeals: payload.totalDeals ?? 0,
    } as ListingPayload;
    this.listings.set(id, record);
    return record;
  }

  async findById(id: string): Promise<ListingPayload | undefined> {
    return this.listings.get(id);
  }

  async incrementDeals(id: string): Promise<ListingPayload | undefined> {
    const record = this.listings.get(id);
    if (!record) return undefined;
    record.totalDeals += 1;
    record.updatedAt = new Date();
    this.listings.set(id, record);
    return record;
  }

  async listActive(): Promise<ListingPayload[]> {
    return [...this.listings.values()].filter((item) => item.status === 'active');
  }
}
