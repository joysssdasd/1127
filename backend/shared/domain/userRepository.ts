import crypto from 'crypto';
import { AuthIdentifier, UserProfile } from './user';
import { getSupabaseClient } from '../../infrastructure/supabase/client';

export interface UserRepository {
  findByOpenId(openId: string): Promise<UserProfile | undefined>;
  findByPhone(phone: string): Promise<UserProfile | undefined>;
  createWithWeChat(wechat: AuthIdentifier): Promise<UserProfile>;
  update(profile: UserProfile): Promise<UserProfile>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, UserProfile> = new Map();

  async findByOpenId(openId: string): Promise<UserProfile | undefined> {
    return [...this.users.values()].find((u) => u.wechat?.openId === openId);
  }

  async findByPhone(phone: string): Promise<UserProfile | undefined> {
    return [...this.users.values()].find((u) => u.phone === phone);
  }

  async createWithWeChat(wechat: AuthIdentifier): Promise<UserProfile> {
    const now = new Date();
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      wechat,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(profile.id, profile);
    return profile;
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    profile.updatedAt = new Date();
    this.users.set(profile.id, profile);
    return profile;
  }
}

type UserRow = {
  id: string;
  phone?: string | null;
  wechat_openid?: string | null;
  wechat_unionid?: string | null;
  points: number;
  total_deals: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export class SupabaseUserRepository implements UserRepository {
  private readonly client = getSupabaseClient();

  private map(row: UserRow): UserProfile {
    return {
      id: row.id,
      phone: row.phone ?? undefined,
      wechat: row.wechat_openid
        ? { openId: row.wechat_openid, unionId: row.wechat_unionid ?? undefined }
        : undefined,
      status: (row.status as UserProfile['status']) ?? 'pending',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      points: row.points,
      totalDeals: row.total_deals,
    } as UserProfile;
  }

  async findByOpenId(openId: string): Promise<UserProfile | undefined> {
    const { data, error } = await this.client.from('users').select('*').eq('wechat_openid', openId).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? this.map(data as UserRow) : undefined;
  }

  async findByPhone(phone: string): Promise<UserProfile | undefined> {
    const { data, error } = await this.client.from('users').select('*').eq('phone', phone).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? this.map(data as UserRow) : undefined;
  }

  async createWithWeChat(wechat: AuthIdentifier): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        wechat_openid: wechat.openId,
        wechat_unionid: wechat.unionId ?? null,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error || !data) {
      throw error ?? new Error('Failed to insert user');
    }
    return this.map(data as UserRow);
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .update({
        phone: profile.phone ?? null,
        wechat_openid: profile.wechat?.openId ?? null,
        wechat_unionid: profile.wechat?.unionId ?? null,
        status: profile.status,
        points: profile.points ?? 0,
        total_deals: profile.totalDeals ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (error || !data) {
      throw error ?? new Error('Failed to update user');
    }
    return this.map(data as UserRow);
  }
}

export function createUserRepository(): UserRepository {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    return new SupabaseUserRepository();
  }
  return new InMemoryUserRepository();
}

