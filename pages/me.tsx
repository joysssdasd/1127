import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import type { ListingPayload } from '../backend/shared/contracts/listing';
import type { PointTransaction } from '../backend/services/points/models/repositories';
import type { ContactViewRecord } from '../backend/services/deal/models/contact-view.entity';

export default function ProfilePage() {
  const { tokens, user, logout, refreshProfile } = useAuth();
  const { message, show } = useToast();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [myListings, setMyListings] = useState<ListingPayload[]>([]);
  const [purchases, setPurchases] = useState<ContactViewRecord[]>([]);
  const [wechatInput, setWechatInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWechatInput(user?.wechat ?? '');
  }, [user?.wechat]);

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
    fetch('/api/users/purchases', { headers: { Authorization: `Bearer ${tokens.accessToken}` } })
      .then((res) => res.json())
      .then((data) => setPurchases(data.data ?? []));
  }, [tokens]);

  const saveProfile = async () => {
    if (!tokens) {
      show('请先登录');
      return;
    }
    if (!wechatInput.trim() && !passwordInput.trim()) {
      show('请填写至少一项信息');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
        body: JSON.stringify({ wechat: wechatInput.trim(), password: passwordInput.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '更新失败');
      }
      show('资料已更新');
      setPasswordInput('');
      await refreshProfile();
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!tokens) {
    return (
      <MainLayout>
        <div className="page-section">
          <p>请先登录后查看个人中心。</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-section">
        <div className="section-heading">我的仪表盘</div>
        <p className="section-subtitle">查看积分、成交情况与快速操作入口。</p>
        <div className="grid-three">
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>积分余额</h3>
            <p style={{ fontSize: 32, margin: 0 }}>{balance}</p>
          </div>
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>累计成交</h3>
            <p style={{ fontSize: 32, margin: 0 }}>{user?.totalDeals ?? 0}</p>
          </div>
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>在架信息</h3>
            <p style={{ fontSize: 32, margin: 0 }}>{myListings.length}</p>
          </div>
        </div>
        <div className="cta-stack">
          <Link className="primary-btn" href="/publish">
            发布信息
          </Link>
          <Link className="secondary-btn" href="/recharge">
            充值积分
          </Link>
          <button className="secondary-btn" onClick={logout}>
            退出登录
          </button>
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">联系方式与安全</div>
        <div className="form-grid">
          <div>
            <label>微信号</label>
            <input value={wechatInput} onChange={(e) => setWechatInput(e.target.value)} placeholder="用于展示给买家" />
          </div>
          <div>
            <label>新密码</label>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="留空则不修改" />
          </div>
          <button className="primary-btn" onClick={saveProfile} disabled={saving}>
            {saving ? '保存中...' : '保存信息'}
          </button>
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">我的发布</div>
        {myListings.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无发布记录，前往发布页开始撮合。</p>}
        <div className="listing-grid">
          {myListings.map((item) => (
            <div key={item.id} className="list-card">
              <h3>{item.title}</h3>
              <p style={{ color: 'var(--muted)' }}>{item.description}</p>
              <div className="meta-row">
                <span className="badge">价格 ¥{item.price}</span>
                <span className="badge">剩余 {item.remainingViews}/{item.viewLimit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">我的足迹</div>
        {purchases.length === 0 && <p style={{ color: 'var(--muted)' }}>还没有解锁过任何线索。</p>}
        <div className="timeline">
          {purchases.slice(0, 6).map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-dot" />
              <div>
                <strong>信息 {item.postId}</strong>
                <p className="form-note">
                  状态：{item.confirmStatus === 'pending' ? '待确认' : '已确认'} · 截止 {new Date(item.confirmDeadline).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">积分流水</div>
        {history.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无流水。</p>}
        {history.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th>时间</th>
                <th>类型</th>
                <th>变动</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.changeType}</td>
                  <td style={{ color: item.amount > 0 ? '#16a34a' : '#dc2626' }}>{item.amount}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast message={message} />
    </MainLayout>
  );
}
