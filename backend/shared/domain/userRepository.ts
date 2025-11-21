import crypto from 'crypto';
import { UserProfile } from './user';
import { getSupabaseClient } from '../../infrastructure/supabase/client';

export interface UserRepository {
  findById(id: string): Promise<UserProfile | undefined>;
  findByPhone(phone: string): Promise<UserProfile | undefined>;
  createWithPhone(phone: string, passwordHash: string, wechat?: string): Promise<UserProfile>;
  update(profile: UserProfile): Promise<UserProfile>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, UserProfile> = new Map();

  async findById(id: string): Promise<UserProfile | undefined> {
    return this.users.get(id);
  }

  async findByPhone(phone: string): Promise<UserProfile | undefined> {
    return [...this.users.values()].find((u) => u.phone === phone);
  }

  async createWithPhone(phone: string, passwordHash: string, wechat?: string): Promise<UserProfile> {
    const now = new Date();
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      phone,
      passwordHash,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      points: 0,
      totalDeals: 0,
    };

    // 在 exactOptionalPropertyTypes 模式下，需要明确处理可选属性
    if (wechat !== undefined) {
      profile.wechat = wechat;
    }

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
  password_hash?: string | null;
  wechat_contact?: string | null;
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
      wechat: row.wechat_contact ?? undefined,
      status: (row.status as UserProfile['status']) ?? 'pending',
      passwordHash: row.password_hash ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      points: row.points,
      totalDeals: row.total_deals,
    } as UserProfile;
  }

  async findById(id: string): Promise<UserProfile | undefined> {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle();
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

  async createWithPhone(phone: string, passwordHash: string, wechat?: string): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        phone,
        password_hash: passwordHash,
        wechat_contact: wechat ?? null,
        status: 'active',
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
        password_hash: profile.passwordHash ?? null,
        wechat_contact: profile.wechat ?? null,
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
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // 检查 Supabase 配置是否有效
  if (url && serviceKey && url.startsWith('http')) {
    try {
      // 验证 URL 格式
      new URL(url);
      console.log('Using Supabase database backend');
      return new SupabaseUserRepository();
    } catch (error) {
      console.warn('Invalid Supabase URL, falling back to in-memory storage:', error);
    }
  } else {
    console.warn('Supabase not configured, using in-memory storage');
  }

  return new InMemoryUserRepository();
}

