import { InMemoryLedgerRepository, InMemoryRechargeRepository } from '../../../backend/services/points/models/repositories';
import { LedgerService, RechargeService } from '../../../backend/services/points/ledger.service';
import { RechargeReminderWorker } from '../../../backend/services/points/workers/rechargeReminder.worker';
import { DomainEventBus } from '../../../backend/shared/utils/eventBus';

describe('Points ledger', () => {
  const ledgerRepo = new InMemoryLedgerRepository();
  const ledger = new LedgerService(ledgerRepo);

  it('deducts and credits balances', async () => {
    await ledger.credit('user-1', 100, 'init');
    await ledger.deduct('user-1', 10, 'publish', 'publish listing');
    const balance = await ledger.balance('user-1');
    expect(balance).toBe(90);
  });
});

describe('RechargeService', () => {
  const ledgerRepo = new InMemoryLedgerRepository();
  const ledger = new LedgerService(ledgerRepo);
  const rechargeRepo = new InMemoryRechargeRepository();
  const service = new RechargeService(rechargeRepo, ledger);
  const events = new DomainEventBus();
  const worker = new RechargeReminderWorker(rechargeRepo, events, -1);

  it('approves recharge and credits ledger', async () => {
    const task = await service.request('user-2', 200, 'voucher.png');
    await service.approve(task.id, 'admin-1');
    const balance = await ledger.balance('user-2');
    expect(balance).toBe(200);
  });

  it('reminds pending recharge tasks', async () => {
    await service.request('user-3', 50, 'voucher.png');
    const reminders = await worker.run();
    expect(reminders).toBeGreaterThan(0);
  });
});
