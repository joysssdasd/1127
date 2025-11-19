import { LedgerRepository, RechargeRepository, PointTransaction, RechargeTask } from './models/repositories';

export class LedgerService {
  constructor(private readonly ledgerRepo: LedgerRepository) {}

  async deduct(userId: string, amount: number, changeType: PointTransaction['changeType'], description: string, referenceId?: string) {
    await this.ledgerRepo.addTransaction({ userId, amount: -Math.abs(amount), changeType, description, referenceId, balanceAfter: 0 });
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string) {
    await this.ledgerRepo.addTransaction({ userId, amount: Math.abs(amount), changeType: 'recharge', description, referenceId, balanceAfter: 0 });
  }

  balance(userId: string) {
    return this.ledgerRepo.getBalance(userId);
  }

  history(userId: string) {
    return this.ledgerRepo.listByUser(userId);
  }
}

export class RechargeService {
  constructor(private readonly repo: RechargeRepository, private readonly ledger: LedgerService) {}

  request(userId: string, amount: number, voucherUrl: string) {
    return this.repo.create({ userId, amount, voucherUrl });
  }

  async approve(id: string, adminId: string) {
    const task = await this.repo.findById(id);
    if (!task) throw new Error('task not found');
    task.status = 'approved';
    await this.repo.update(task);
    await this.ledger.credit(task.userId, task.amount, `recharge approved by ${adminId}`, id);
  }

  async reject(id: string, adminId: string) {
    const task = await this.repo.findById(id);
    if (!task) throw new Error('task not found');
    task.status = 'rejected';
    await this.repo.update(task);
  }

  pending() {
    return this.repo.findPending();
  }
}
