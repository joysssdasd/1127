import { getSupabaseClient } from '../../infrastructure/supabase/client';

export interface PointsClient {
  deduct(userId: string, amount: number, reason: string, referenceId: string): Promise<void>;
}

export class InMemoryPointsClient implements PointsClient {
  private readonly balances: Map<string, number> = new Map();

  constructor(private readonly initialBalance = 1000) {}

  private ensure(userId: string): number {
    if (!this.balances.has(userId)) {
      this.balances.set(userId, this.initialBalance);
    }
    return this.balances.get(userId)!;
  }

  async deduct(userId: string, amount: number, reason: string, referenceId: string): Promise<void> {
    const balance = this.ensure(userId);
    if (balance < amount) {
      throw new Error('insufficient points');
    }
    this.balances.set(userId, balance - amount);
  }
}

export class SupabasePointsClient implements PointsClient {
  private readonly client = getSupabaseClient();

  async deduct(userId: string, amount: number, reason: string, referenceId: string): Promise<void> {
    const { data, error } = await this.client
      .from<{ points: number }>('users')
      .select('points')
      .eq('id', userId)
      .single();
    if (error || !data) {
      throw error ?? new Error('user not found');
    }
    if (data.points < amount) {
      throw new Error('insufficient points');
    }
    const newBalance = data.points - amount;
    const { error: updateError } = await this.client.from('users').update({ points: newBalance }).eq('id', userId);
    if (updateError) {
      throw updateError;
    }
    const { error: insertError } = await this.client.from('point_transactions').insert({
      user_id: userId,
      change_type: reason,
      amount: -Math.abs(amount),
      balance_after: newBalance,
      description: reason,
      reference_id: referenceId,
    });
    if (insertError) {
      throw insertError;
    }
  }
}

export function createPointsClient(): PointsClient {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL)) {
    return new SupabasePointsClient();
  }
  return new InMemoryPointsClient();
}
