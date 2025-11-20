import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { ListingPayload } from '../../backend/shared/contracts/listing';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../components/auth/AuthContext';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

type ContactTicket = {
  contact: string;
  token: string;
  deadline: string;
};

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { tokens, user } = useAuth();
  const { message, show } = useToast();
  const [listing, setListing] = useState<ListingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<ContactTicket | null>(null);

  useEffect(() => {
    if (typeof id !== 'string') return;
    setLoading(true);
    fetch(`/api/listings/${id}`)
      .then((res) => res.json())
      .then((data) => setListing(data.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const purchase = async () => {
    if (!listing) return;
    if (!tokens) {
      show('请先登录再解锁联系方式');
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
        body: JSON.stringify({ postId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '解锁失败');
      }
      setTicket({
        contact: data.data.contact,
        token: data.data.contactToken,
        deadline: data.data.confirmDeadline,
      });
      show(`已解锁微信：${data.data.contact}`);
    } catch (error) {
      show((error as Error).message);
    }
  };

  const republish = async () => {
    if (!listing) return;
    if (!tokens || user?.id !== listing.userId) {
      show('仅发布者可重新上架');
      return;
    }
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({ action: 'republish' }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data.error ?? '刷新失败');
      return;
    }
    setListing(data.data);
    show('已重新上架并刷新剩余查看次数');
  };

  const formatDeadline = (value: string) => new Date(value).toLocaleString();

  return (
    <MainLayout>
      <div className="page-section">
        {loading && <p>正在加载数据...</p>}
        {!loading && !listing && <p>该信息已下架或不存在。</p>}
        {!loading && listing && (
          <>
            <div className="meta-row">
              <span className="chip">{listing.tradeType === 'sell' ? '出售' : listing.tradeType === 'buy' ? '求购' : '其他'}</span>
              <span className="chip emphasis">{listing.status === 'active' ? '在售' : '已下架'}</span>
            </div>
            <h1 style={{ marginTop: 12 }}>{listing.title}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>{listing.description}</p>
            <div className="meta-row" style={{ marginTop: 12 }}>
              <span className="badge">
                <strong>价格</strong> ¥{listing.price}
              </span>
              <span className="badge">剩余 {listing.remainingViews}/{listing.viewLimit} 次查看</span>
              <span className="badge">成交 {listing.totalDeals ?? 0} 次</span>
            </div>
            <div className="list-card-actions" style={{ marginTop: 18 }}>
              <button className="primary-btn" onClick={purchase} disabled={!tokens || listing.status !== 'active'}>
                解锁微信
              </button>
              {user?.id === listing.userId && (
                <button className="secondary-btn" onClick={republish}>
                  重新上架
                </button>
              )}
            </div>
            {ticket && (
              <div className="contact-card" style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, color: '#0369a1' }}>已解锁微信号</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{ticket.contact}</div>
                <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--muted)' }}>
                  凭证 {ticket.token} · 请在 {formatDeadline(ticket.deadline)} 前完成成交确认
                </p>
              </div>
            )}
            <div className="timeline" style={{ marginTop: 32 }}>
              <div className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <strong>步骤 1 · 解锁微信</strong>
                  <p className="form-note">每次扣除 1 积分，自动记录到积分流水中，管理员可回溯。</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <strong>步骤 2 · 24 小时跟进</strong>
                  <p className="form-note">系统会在 24 小时内提醒买家回传成交截图，超时自动顺延。</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <strong>步骤 3 · 成交回执</strong>
                  <p className="form-note">提交截图后，成交次数 +1，卖家积分同步增加。</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
