import { useEffect, useState } from 'react';
import { createLedgerRepository, createRechargeRepository } from '../../../../services/points/models/repositories';
import type { RechargeTask } from '../../../../services/points/models/repositories';
import { LedgerService, RechargeService } from '../../../../services/points/ledger.service';
import { useReminder } from '../../hooks/useReminder';

const ledger = new LedgerService(createLedgerRepository());
const rechargeRepo = createRechargeRepository();
const rechargeService = new RechargeService(rechargeRepo, ledger);

export function RechargeTaskList() {
  const [tasks, setTasks] = useState<RechargeTask[]>([]);
  const reminder = useReminder(30000, async () => (await rechargeService.pending()).length);

  const load = async () => {
    const pending = await rechargeService.pending();
    setTasks(pending);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    await rechargeService.approve(id, 'admin');
    load();
  };

  const reject = async (id: string) => {
    await rechargeService.reject(id, 'admin');
    load();
  };

  return (
    <section>
      <h3>充值待办 {reminder > 0 && <span className="badge">{reminder}</span>}</h3>
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>金额</th>
            <th>凭证</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.userId}</td>
              <td>{task.amount}</td>
              <td>{task.voucherUrl}</td>
              <td>
                <button onClick={() => approve(task.id)}>通过</button>
                <button onClick={() => reject(task.id)}>拒绝</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
