import { ListingPayload } from '../../../shared/contracts/listing';
import { getSupabaseClient } from '../../../infrastructure/supabase/client';
import { ListingRepository } from './listing.repo';

interface ListingRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  trade_type: string;
  keywords: string[];
  ai_summary?: string | null;
  remaining_views: number;
  view_limit: number;
  total_deals: number;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ListingRow): ListingPayload {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    tradeType: row.trade_type as ListingPayload['tradeType'],
    keywords: row.keywords ?? [],
    aiSummary: row.ai_summary ?? undefined,
    remainingViews: row.remaining_views,
    viewLimit: row.view_limit,
    totalDeals: row.total_deals,
    status: row.status as ListingPayload['status'],
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } as ListingPayload;
}

export class SupabaseListingRepository implements ListingRepository {
  private readonly client = getSupabaseClient();

  async save(payload: Omit<ListingPayload, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date }): Promise<ListingPayload> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from('posts')
      .upsert(
        {
          id: payload.id,
          user_id: payload.userId,
          title: payload.title,
          description: payload.description,
          price: payload.price,
          trade_type: payload.tradeType,
          keywords: payload.keywords,
          ai_summary: payload.aiSummary ?? null,
          remaining_views: payload.remainingViews,
          view_limit: payload.viewLimit,
          total_deals: payload.totalDeals ?? 0,
          status: payload.status ?? 'active',
          expires_at: payload.expiresAt.toISOString(),
          created_at: payload.createdAt?.toISOString() ?? nowIso,
          updated_at: payload.updatedAt?.toISOString() ?? nowIso,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();
    if (error || !data) {
      throw error ?? new Error('Failed to save listing');
    }
    return mapRow(data as ListingRow);
  }

  async findById(id: string): Promise<ListingPayload | undefined> {
    const { data, error } = await this.client.from('posts').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? mapRow(data as ListingRow) : undefined;
  }

  async listActive(): Promise<ListingPayload[]> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from('posts')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', nowIso);
    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => mapRow(row as ListingRow));
  }

  async incrementDeals(id: string): Promise<ListingPayload | undefined> {
    const current = await this.findById(id);
    if (!current) {
      return undefined;
    }
    return this.save({
      ...current,
      totalDeals: (current.totalDeals ?? 0) + 1,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });
  }
}
