import { useEffect, useMemo, useState } from 'react';
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

  const refreshData = async () => {
    if (!authHeaders) return;
    try {
      const [rechargeRes, dealRes] = await Promise.all([
        fetch('/api/admin/recharge', { headers: authHeaders }),
        fetch('/api/admin/deals', { headers: authHeaders }),
      ]);
      if (!rechargeRes.ok || !dealRes.ok) {
        show('数据加载失败');
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

  useEffect(() => {
    if (!loading) {
      if (!tokens || !isAdmin) {
        show('仅管理员可访问');
        router.replace('/');
      } else {
        refreshData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tokens, isAdmin]);

  const handleRecharge = async (id: string, action: 'approve' | 'reject') => {
    if (!authHeaders) return;
    const res = await fetch('/api/admin/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      show('处理失败');
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

  const statCards = useMemo(
    () => [
      { title: '待审核充值', value: recharges.length },
      { title: '待确认成交', value: deals.length },
    ],
    [recharges.length, deals.length],
  );

  if (!tokens || (!isAdmin && !loading)) {
    return (
      <MainLayout>
        <div className="page-section">
          <p>正在校验权限...</p>
        </div>
        <Toast message={message} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-section">
        <div className="section-heading">管理员面板</div>
        <p className="section-subtitle">管理员必须使用短信模式登录，此处无公开入口。</p>
        <div className="grid-two">
          {statCards.map((stat) => (
            <div key={stat.title} className="feature-card">
              <h3 style={{ marginTop: 0 }}>{stat.title}</h3>
              <p style={{ fontSize: 32, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="cta-stack">
          <button className="secondary-btn" onClick={refreshData}>
            刷新数据
          </button>
          <button className="primary-btn" onClick={remindDeals}>
            一键提醒成交
          </button>
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">充值审核</div>
        {recharges.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无充值待审核。</p>}
        <div className="listing-grid">
          {recharges.map((task) => (
            <div key={task.id} className="list-card">
              <h3>用户 {task.userId}</h3>
              <p style={{ color: 'var(--muted)' }}>金额：{task.amount}</p>
              <a href={task.voucherUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#0a84ff' }}>
                查看凭证
              </a>
              <div className="list-card-actions">
                <button className="primary-btn" onClick={() => handleRecharge(task.id, 'approve')}>
                  通过
                </button>
                <button className="secondary-btn" onClick={() => handleRecharge(task.id, 'reject')}>
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">待确认成交</div>
        {deals.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无待处理记录。</p>}
        <div className="timeline">
          {deals.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-dot" />
              <div>
                <strong>信息 {item.postId}</strong>
                <p className="form-note">
                  买家 {item.buyerId} · 截止 {new Date(item.confirmDeadline).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
