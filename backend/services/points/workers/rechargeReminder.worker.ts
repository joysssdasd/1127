import dayjs from 'dayjs';
import { RechargeRepository } from '../models/repositories';
import { DomainEventBus } from '../../../shared/utils/eventBus';
import { metrics } from '../../../shared/observability/metrics';

export class RechargeReminderWorker {
  constructor(private readonly repo: RechargeRepository, private readonly events: DomainEventBus, private readonly timeoutMinutes = 30) {}

  async run(): Promise<number> {
    const pending = await this.repo.findPending();
    let reminders = 0;
    for (const task of pending) {
      const minutes = dayjs().diff(task.createdAt, 'minute');
      if (minutes >= this.timeoutMinutes) {
        this.events.emit('recharge.pending.reminder', { taskId: task.id, userId: task.userId });
        task.remindCount += 1;
        task.createdAt = new Date();
        await this.repo.update(task);
        reminders += 1;
      }
    }
    if (reminders > 0) {
      metrics.increment('recharge.reminder', reminders);
    }
    return reminders;
  }
}
