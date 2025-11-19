import crypto from 'crypto';
import { getSupabaseClient } from '../../../infrastructure/supabase/client';

export interface PointTransaction {
  id: string;
  userId: string;
  changeType: 'publish' | 'view' | 'republish' | 'recharge' | 'bonus' | 'listing.contact';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string | undefined;
  createdAt: Date;
}

export interface RechargeTask {
  id: string;
  userId: string;
  amount: number;
  voucherUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  remindCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerRepository {
  addTransaction(entry: Omit<PointTransaction, 'id' | 'createdAt'>): Promise<PointTransaction>;
  getBalance(userId: string): Promise<number>;
  listByUser(userId: string): Promise<PointTransaction[]>;
}

export class InMemoryLedgerRepository implements LedgerRepository {
  private readonly balances: Map<string, number> = new Map<string, number>();
  private readonly transactions: PointTransaction[] = [];

  async addTransaction(entry: Omit<PointTransaction, 'id' | 'createdAt'>): Promise<PointTransaction> {
    const id = crypto.randomUUID();
    const balance = this.balances.get(entry.userId) ?? 0;
    const balanceAfter = balance + entry.amount;
    if (balanceAfter < 0) {
      throw new Error('insufficient balance');
    }
    this.balances.set(entry.userId, balanceAfter);
    const record: PointTransaction = { ...entry, id, balanceAfter, createdAt: new Date() };
    this.transactions.push(record);
    return record;
  }

  async getBalance(userId: string): Promise<number> {
    return this.balances.get(userId) ?? 0;
  }

  async listByUser(userId: string): Promise<PointTransaction[]> {
    return this.transactions.filter((t) => t.userId === userId);
  }
}

interface PointTransactionRow {
  id: string;
  user_id: string;
  change_type: string;
  amount: number;
  balance_after: number;
  description?: string | null;
  reference_id?: string | null;
  created_at: string;
}

export class SupabaseLedgerRepository implements LedgerRepository {
  private readonly client = getSupabaseClient();

  async addTransaction(entry: Omit<PointTransaction, 'id' | 'createdAt'>): Promise<PointTransaction> {
    const { data: user, error } = await this.client.from('users').select('points').eq('id', entry.userId).single();
    if (error || !user) {
      throw error ?? new Error('user not found');
    }
    const balanceAfter = (user as { points: number }).points + entry.amount;
    if (balanceAfter < 0) {
      throw new Error('insufficient balance');
    }
    const { error: updateError } = await this.client.from('users').update({ points: balanceAfter }).eq('id', entry.userId);
    if (updateError) {
      throw updateError;
    }
    const { data: inserted, error: insertError } = await this.client
      .from('point_transactions')
      .insert({
        user_id: entry.userId,
        change_type: entry.changeType,
        amount: entry.amount,
        balance_after: balanceAfter,
        description: entry.description,
        reference_id: entry.referenceId ?? null,
      })
      .select('*')
      .single();
    if (insertError || !inserted) {
      throw insertError ?? new Error('failed to insert transaction');
    }
    const row = inserted as PointTransactionRow;
    return {
      id: row.id,
      userId: row.user_id,
      changeType: row.change_type as PointTransaction['changeType'],
      amount: row.amount,
      balanceAfter: row.balance_after,
      description: row.description ?? '',
      referenceId: row.reference_id ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }

  async getBalance(userId: string): Promise<number> {
    const { data, error } = await this.client.from('users').select('points').eq('id', userId).single();
    if (error || !data) {
      throw error ?? new Error('user not found');
    }
    return (data as { points: number }).points;
  }

  async listByUser(userId: string): Promise<PointTransaction[]> {
    const { data, error } = await this.client
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      changeType: row.change_type as PointTransaction['changeType'],
      amount: row.amount,
      balanceAfter: row.balance_after,
      description: row.description ?? '',
      referenceId: row.reference_id ?? undefined,
      createdAt: new Date(row.created_at),
    }));
  }
}

export interface RechargeRepository {
  create(task: Omit<RechargeTask, 'id' | 'status' | 'remindCount' | 'createdAt' | 'updatedAt'>): Promise<RechargeTask>;
  update(task: RechargeTask): Promise<void>;
  findPending(): Promise<RechargeTask[]>;
  findById(id: string): Promise<RechargeTask | undefined>;
}

export class InMemoryRechargeRepository implements RechargeRepository {
  private readonly tasks: Map<string, RechargeTask> = new Map<string, RechargeTask>();

  async create(task: Omit<RechargeTask, 'id' | 'status' | 'remindCount' | 'createdAt' | 'updatedAt'>): Promise<RechargeTask> {
    const id = crypto.randomUUID();
    const record: RechargeTask = {
      ...task,
      id,
      status: 'pending',
      remindCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, record);
    return record;
  }

  async update(task: RechargeTask): Promise<void> {
    task.updatedAt = new Date();
    this.tasks.set(task.id, task);
  }

  async findPending(): Promise<RechargeTask[]> {
    return [...this.tasks.values()].filter((task) => task.status === 'pending');
  }

  async findById(id: string): Promise<RechargeTask | undefined> {
    return this.tasks.get(id);
  }
}

interface RechargeRow {
  id: string;
  user_id: string;
  amount: number;
  voucher_url: string;
  status: string;
  remind_count: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseRechargeRepository implements RechargeRepository {
  private readonly client = getSupabaseClient();

  async create(task: Omit<RechargeTask, 'id' | 'status' | 'remindCount' | 'createdAt' | 'updatedAt'>): Promise<RechargeTask> {
    const { data, error } = await this.client
      .from('recharge_tasks')
      .insert({ user_id: task.userId, amount: task.amount, voucher_url: task.voucherUrl })
      .select('*')
      .single();
    if (error || !data) {
      throw error ?? new Error('failed to create recharge task');
    }
    return this.mapRow(data as RechargeRow);
  }

  async update(task: RechargeTask): Promise<void> {
    const { error } = await this.client
      .from('recharge_tasks')
      .update({
        amount: task.amount,
        voucher_url: task.voucherUrl,
        status: task.status,
        remind_count: task.remindCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);
    if (error) {
      throw error;
    }
  }

  async findPending(): Promise<RechargeTask[]> {
    const { data, error } = await this.client
      .from('recharge_tasks')
      .select('*')
      .eq('status', 'pending');
    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => this.mapRow(row as RechargeRow));
  }

  async findById(id: string): Promise<RechargeTask | undefined> {
    const { data, error } = await this.client
      .from('recharge_tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? this.mapRow(data as RechargeRow) : undefined;
  }

  private mapRow(row: RechargeRow): RechargeTask {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      voucherUrl: row.voucher_url,
      status: row.status as RechargeTask['status'],
      remindCount: row.remind_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export function createLedgerRepository(): LedgerRepository {
  return process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)
    ? new SupabaseLedgerRepository()
    : new InMemoryLedgerRepository();
}

export function createRechargeRepository(): RechargeRepository {
  return process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)
    ? new SupabaseRechargeRepository()
    : new InMemoryRechargeRepository();
}



