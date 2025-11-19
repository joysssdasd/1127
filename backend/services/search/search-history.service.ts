import { getSupabaseClient } from '../../infrastructure/supabase/client';

const MAX_HISTORY = 10;

export interface SearchHistoryStore {
  record(userId: string, keyword: string): Promise<void>;
  history(userId: string): Promise<string[]>;
  clear(userId: string): Promise<void>;
}

export class InMemorySearchHistoryStore implements SearchHistoryStore {
  private readonly store: Map<string, string[]> = new Map();

  async record(userId: string, keyword: string): Promise<void> {
    if (!keyword) return;
    const list = this.store.get(userId) ?? [];
    const normalized = keyword.trim();
    const filtered = list.filter((item) => item !== normalized);
    filtered.unshift(normalized);
    this.store.set(userId, filtered.slice(0, MAX_HISTORY));
  }

  async history(userId: string): Promise<string[]> {
    return [...(this.store.get(userId) ?? [])];
  }

  async clear(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

export class SupabaseSearchHistoryStore implements SearchHistoryStore {
  private readonly client = getSupabaseClient();

  async record(userId: string, keyword: string): Promise<void> {
    const normalized = keyword.trim();
    if (!normalized) return;
    const { error } = await this.client
      .from('search_history')
      .upsert(
        { user_id: userId, keyword: normalized, created_at: new Date().toISOString() },
        { onConflict: 'user_id,keyword' }
      );
    if (error) {
      throw error;
    }
  }

  async history(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('search_history')
      .select('keyword')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);
    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => (row as { keyword: string }).keyword);
  }

  async clear(userId: string): Promise<void> {
    const { error } = await this.client.from('search_history').delete().eq('user_id', userId);
    if (error) {
      throw error;
    }
  }
}

export function createSearchHistoryStore(): SearchHistoryStore {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)) {
    return new SupabaseSearchHistoryStore();
  }
  return new InMemorySearchHistoryStore();
}
