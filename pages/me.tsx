import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import type { ListingPayload } from '../backend/shared/contracts/listing';
import type { PointTransaction } from '../backend/services/points/models/repositories';

export default function ProfilePage() {
  const { tokens, user, logout } = useAuth();
  const { message, show } = useToast();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [myListings, setMyListings] = useState<ListingPayload[]>([]);

  useEffect(() => {
    if (!tokens) return;
    fetch('/api/points/balance', { headers: { Authorization: `Bearer ${tokens.accessToken}` } })
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => show('无法获取积分余额'));
    fetch('/api/points/history', { headers: { Authorization: `Bearer ${tokens.accessToken}` } })
      .then((res) => res.json())
      .then((data) => setHistory(data.data ?? []));
    fetch('/api/users/listings', { headers: { Authorization: `Bearer ${tokens.accessToken}` } })
      .then((res) => res.json())
      .then((data) => setMyListings(data.data ?? []));
  }, [tokens]);

  if (!tokens) {
    return (
      <MainLayout>
        <div className="page-section">请先登录以查看个人中心。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-section">
        <h2>个人概览</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
          <div style={{ background: '#eef2ff', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{balance}</div>
            <div style={{ color: 'var(--muted)' }}>当前积分</div>
          </div>
          <div style={{ background: '#ecfeff', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{user?.totalDeals ?? 0}</div>
            <div style={{ color: 'var(--muted)' }}>累计成交</div>
          </div>
          <div style={{ background: '#fef9c3', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{myListings.length}</div>
            <div style={{ color: 'var(--muted)' }}>我的在售信息</div>
          </div>
        </div>
        <button className="secondary-btn" style={{ marginTop: 16 }} onClick={logout}>
          退出登录
        </button>
      </div>

      <div className="page-section">
        <h3>我的发布</h3>
        {myListings.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无在售信息</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          {myListings.map((item) => (
            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{item.description}</div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                价格 ¥{item.price} ｜ 剩余查看 {item.remainingViews}/{item.viewLimit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <h3>积分流水</h3>
        {history.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无流水</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th>类型</th>
              <th>金额</th>
              <th>描述</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>{item.changeType}</td>
                <td style={{ color: item.amount > 0 ? '#16a34a' : '#dc2626' }}>{item.amount}</td>
                <td>{item.description}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
