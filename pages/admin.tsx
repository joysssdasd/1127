import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../components/layout/MainLayout';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import type { RechargeTask } from '../backend/services/points/models/repositories';
import type { ContactViewRecord } from '../backend/services/deal/models/contact-view.entity';
import { useAuth } from '../components/auth/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { tokens, isAdmin, loading } = useAuth();
  const { message, show } = useToast();
  const [recharges, setRecharges] = useState<RechargeTask[]>([]);
  const [deals, setDeals] = useState<ContactViewRecord[]>([]);

  const authHeaders = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined;

  useEffect(() => {
    if (!loading) {
      if (!tokens || !isAdmin) {
        show('该页面仅管理员可访问');
        router.replace('/');
      } else {
        refreshData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tokens, isAdmin]);

  const refreshData = async () => {
    if (!authHeaders) return;
    try {
      const [rechargeRes, dealRes] = await Promise.all([
        fetch('/api/admin/recharge', { headers: authHeaders }),
        fetch('/api/admin/deals', { headers: authHeaders }),
      ]);
      if (!rechargeRes.ok || !dealRes.ok) {
        show('加载失败');
        return;
      }
      const rechargeData = await rechargeRes.json();
      const dealData = await dealRes.json();
      setRecharges(rechargeData.data ?? []);
      setDeals(dealData.data ?? []);
    } catch (error) {
      show((error as Error).message);
    }
  };

  const handleRecharge = async (id: string, action: 'approve' | 'reject') => {
    if (!authHeaders) return;
    const res = await fetch('/api/admin/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    if (!authHeaders) return;
    const res = await fetch('/api/admin/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ action: 'remind' }),
    });
    if (!res.ok) {
      show('提醒失败');
      return;
    }
    const data = await res.json();
    show(`已提醒 ${data.reminded} 位买家`);
  };

  if (!tokens || (!isAdmin && !loading)) {
    return (
      <MainLayout>
        <div className="page-section">正在校验权限...</div>
        <Toast message={message} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>充值审批</h3>
          <button className="secondary-btn" onClick={refreshData}>
            刷新
          </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>成交回执待跟进</h3>
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
          {deals.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无需要跟进的记录</p>}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
