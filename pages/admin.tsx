import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import type { RechargeTask } from '../backend/services/points/models/repositories';
import type { ContactViewRecord } from '../backend/services/deal/models/contact-view.entity';

const STORAGE_KEY = 'admin-key';

export default function AdminPage() {
  const { message, show } = useToast();
  const [adminKey, setAdminKey] = useState('');
  const [recharges, setRecharges] = useState<RechargeTask[]>([]);
  const [deals, setDeals] = useState<ContactViewRecord[]>([]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setAdminKey(saved);
      refreshData(saved);
    }
  }, []);

  const headers = adminKey ? { 'x-admin-key': adminKey } : undefined;

  const refreshData = async (key = adminKey) => {
    if (!key) {
      show('请先输入管理密钥，默认 admin-demo');
      return;
    }
    try {
      const [rechargeRes, dealRes] = await Promise.all([
        fetch('/api/admin/recharge', { headers: { 'x-admin-key': key } }),
        fetch('/api/admin/deals', { headers: { 'x-admin-key': key } }),
      ]);
      if (!rechargeRes.ok || !dealRes.ok) {
        show('密钥无效');
        return;
      }
      const rechargeData = await rechargeRes.json();
      const dealData = await dealRes.json();
      setRecharges(rechargeData.data ?? []);
      setDeals(dealData.data ?? []);
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
      show((error as Error).message);
    }
  };

  const handleRecharge = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      show('操作失败');
      return;
    }
    show(action === 'approve' ? '已通过' : '已拒绝');
    refreshData();
  };

  const remindDeals = async () => {
    const res = await fetch('/api/admin/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
      body: JSON.stringify({ action: 'remind' }),
    });
    if (!res.ok) {
      show('提醒失败');
      return;
    }
    const data = await res.json();
    show(`已提醒 ${data.reminded} 位买家`);
  };

  return (
    <MainLayout>
      <div className="page-section">
        <h2>后台运营工作台</h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin 密钥，默认 admin-demo" />
          <button className="primary-btn" onClick={() => refreshData()}>
            载入数据
          </button>
        </div>
      </div>

      <div className="page-section">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>充值审批</h3>
          <span style={{ color: 'var(--muted)' }}>待处理：{recharges.length}</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {recharges.map((task) => (
            <div key={task.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div>用户：{task.userId}</div>
                <div>金额：{task.amount}</div>
                <div>凭证：{task.voucherUrl}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary-btn" onClick={() => handleRecharge(task.id, 'approve')}>
                  通过
                </button>
                <button className="secondary-btn" onClick={() => handleRecharge(task.id, 'reject')}>
                  拒绝
                </button>
              </div>
            </div>
          ))}
          {recharges.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无充值申请</p>}
        </div>
      </div>

      <div className="page-section">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>成交回执跟进</h3>
          <button className="secondary-btn" onClick={remindDeals}>
            发送提醒
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {deals.map((item) => (
            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div>信息ID：{item.postId}</div>
              <div>买家：{item.buyerId}</div>
              <div>截止：{new Date(item.confirmDeadline).toLocaleString()}</div>
            </div>
          ))}
          {deals.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无需要跟进的回执</p>}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
