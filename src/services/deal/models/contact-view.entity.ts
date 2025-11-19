import crypto from 'crypto';
import { getSupabaseClient } from '../../../infrastructure/supabase/client';

export type ConfirmStatus = 'pending' | 'confirmed' | 'skipped';

export interface ContactViewRecord {
  id: string;
  postId: string;
  buyerId: string;
  sellerId: string;
  deductedPoints: number;
  copied: boolean;
  copiedAt?: Date;
  confirmStatus: ConfirmStatus;
  confirmPayload?: string;
  confirmDeadline: Date;
  createdAt: Date;
}

export interface DealStatRecord {
  postId: string;
  sellerId: string;
  totalDeals: number;
  updatedAt: Date;
}

export interface ContactViewRepository {
  create(record: Omit<ContactViewRecord, 'id' | 'createdAt'>): Promise<ContactViewRecord>;
  listPendingConfirmations(now: Date): Promise<ContactViewRecord[]>;
  update(record: ContactViewRecord): Promise<void>;
  findById(id: string): Promise<ContactViewRecord | undefined>;
  listByPost(postId: string): Promise<ContactViewRecord[]>;
}

export interface DealStatRepository {
  increment(postId: string, sellerId: string): Promise<DealStatRecord>;
}

export class InMemoryContactViewRepository implements ContactViewRepository {
  private readonly store = new Map<string, ContactViewRecord>();

  async create(record: Omit<ContactViewRecord, 'id' | 'createdAt'>): Promise<ContactViewRecord> {
    const id = crypto.randomUUID();
    const created: ContactViewRecord = { ...record, id, createdAt: new Date() };
    this.store.set(id, created);
    return created;
  }

  async listPendingConfirmations(now: Date): Promise<ContactViewRecord[]> {
    return [...this.store.values()].filter((item) => item.confirmStatus === 'pending' && item.confirmDeadline <= now);
  }

  async update(record: ContactViewRecord): Promise<void> {
    this.store.set(record.id, record);
  }

  async findById(id: string): Promise<ContactViewRecord | undefined> {
    return this.store.get(id);
  }

  async listByPost(postId: string): Promise<ContactViewRecord[]> {
    return [...this.store.values()].filter((item) => item.postId === postId);
  }
}

export class InMemoryDealStatRepository implements DealStatRepository {
  private readonly stats = new Map<string, DealStatRecord>();

  private key(postId: string): string {
    return postId;
  }

  async increment(postId: string, sellerId: string): Promise<DealStatRecord> {
    const key = this.key(postId);
    const existing = this.stats.get(key);
    const record: DealStatRecord = existing
      ? { ...existing, totalDeals: existing.totalDeals + 1, updatedAt: new Date() }
      : { postId, sellerId, totalDeals: 1, updatedAt: new Date() };
    this.stats.set(key, record);
    return record;
  }
}

interface ContactViewRow {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  deducted_points: number;
  copied: boolean;
  copied_at?: string | null;
  confirm_status: string;
  confirm_payload?: string | null;
  confirm_deadline: string;
  created_at: string;
}

function mapContactRow(row: ContactViewRow): ContactViewRecord {
  return {
    id: row.id,
    postId: row.post_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    deductedPoints: row.deducted_points,
    copied: row.copied,
    copiedAt: row.copied_at ? new Date(row.copied_at) : undefined,
    confirmStatus: row.confirm_status as ConfirmStatus,
    confirmPayload: row.confirm_payload ?? undefined,
    confirmDeadline: new Date(row.confirm_deadline),
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseContactViewRepository implements ContactViewRepository {
  private readonly client = getSupabaseClient();

  async create(record: Omit<ContactViewRecord, 'id' | 'createdAt'>): Promise<ContactViewRecord> {
    const { data, error } = await this.client
      .from<ContactViewRow>('contact_views')
      .insert({
        post_id: record.postId,
        buyer_id: record.buyerId,
        seller_id: record.sellerId,
        deducted_points: record.deductedPoints,
        copied: record.copied,
        copied_at: record.copiedAt?.toISOString() ?? null,
        confirm_status: record.confirmStatus,
        confirm_payload: record.confirmPayload ?? null,
        confirm_deadline: record.confirmDeadline.toISOString(),
      })
      .select('*')
      .single();
    if (error || !data) {
      throw error ?? new Error('Failed to create contact view');
    }
    return mapContactRow(data);
  }

  async listPendingConfirmations(now: Date): Promise<ContactViewRecord[]> {
    const { data, error } = await this.client
      .from<ContactViewRow>('contact_views')
      .select('*')
      .eq('confirm_status', 'pending')
      .lte('confirm_deadline', now.toISOString());
    if (error) {
      throw error;
    }
    return (data ?? []).map(mapContactRow);
  }

  async update(record: ContactViewRecord): Promise<void> {
    const { error } = await this.client
      .from('contact_views')
      .update({
        deducted_points: record.deductedPoints,
        copied: record.copied,
        copied_at: record.copiedAt?.toISOString() ?? null,
        confirm_status: record.confirmStatus,
        confirm_payload: record.confirmPayload ?? null,
        confirm_deadline: record.confirmDeadline.toISOString(),
      })
      .eq('id', record.id);
    if (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<ContactViewRecord | undefined> {
    const { data, error } = await this.client
      .from<ContactViewRow>('contact_views')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? mapContactRow(data) : undefined;
  }

  async listByPost(postId: string): Promise<ContactViewRecord[]> {
    const { data, error } = await this.client
      .from<ContactViewRow>('contact_views')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? []).map(mapContactRow);
  }
}

interface DealStatRow {
  post_id: string;
  seller_id: string;
  total_deals: number;
  updated_at: string;
}

export class SupabaseDealStatRepository implements DealStatRepository {
  private readonly client = getSupabaseClient();

  async increment(postId: string, sellerId: string): Promise<DealStatRecord> {
    const { data } = await this.client
      .from<DealStatRow>('deal_stats')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();
    if (!data) {
      const { data: inserted, error } = await this.client
        .from<DealStatRow>('deal_stats')
        .insert({ post_id: postId, seller_id: sellerId, total_deals: 1 })
        .select('*')
        .single();
      if (error || !inserted) {
        throw error ?? new Error('Failed to insert deal stat');
      }
      return { postId, sellerId, totalDeals: inserted.total_deals, updatedAt: new Date(inserted.updated_at) };
    }

    const { data: updated, error: updateError } = await this.client
      .from<DealStatRow>('deal_stats')
      .update({ total_deals: data.total_deals + 1, updated_at: new Date().toISOString() })
      .eq('post_id', postId)
      .select('*')
      .single();
    if (updateError || !updated) {
      throw updateError ?? new Error('Failed to update deal stat');
    }
    return { postId, sellerId: updated.seller_id, totalDeals: updated.total_deals, updatedAt: new Date(updated.updated_at) };
  }
}
