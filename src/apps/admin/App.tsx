import { RechargeTaskList } from './pages/recharge/TaskList';
import { DealFollowUp } from './pages/deal/FollowUp';

export function AdminApp() {
  return (
    <main>
      <RechargeTaskList />
      <DealFollowUp />
    </main>
  );
}
