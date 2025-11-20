import crypto from 'crypto';
import { UserProfile } from './user';
import { getSupabaseClient } from '../../infrastructure/supabase/client';

export interface UserRepository {
  findByPhone(phone: string): Promise<UserProfile | undefined>;
  createWithPhone(phone: string, passwordHash: string): Promise<UserProfile>;
  update(profile: UserProfile): Promise<UserProfile>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, UserProfile> = new Map();

  async findByPhone(phone: string): Promise<UserProfile | undefined> {
    return [...this.users.values()].find((u) => u.phone === phone);
  }

  async createWithPhone(phone: string, passwordHash: string): Promise<UserProfile> {
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
      status: (row.status as UserProfile['status']) ?? 'pending',
      passwordHash: row.password_hash ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      points: row.points,
      totalDeals: row.total_deals,
    } as UserProfile;
  }

  async findByPhone(phone: string): Promise<UserProfile | undefined> {
    const { data, error } = await this.client.from('users').select('*').eq('phone', phone).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? this.map(data as UserRow) : undefined;
  }

  async createWithPhone(phone: string, passwordHash: string): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        phone,
        password_hash: passwordHash,
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

