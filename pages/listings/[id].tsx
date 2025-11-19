import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { ListingPayload } from '../../backend/shared/contracts/listing';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../components/auth/AuthContext';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { tokens, user } = useAuth();
  const { message, show } = useToast();
  const [listing, setListing] = useState<ListingPayload | null>(null);
  const [loading, setLoading] = useState(true);

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
      show('请先登录');
      return;
    }
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({ postId: listing.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data.error ?? '购买失败');
      return;
    }
    show(`联系令牌：${data.data.contactToken}`);
  };

  const republish = async () => {
    if (!listing) return;
    if (!tokens || user?.id !== listing.userId) {
      show('仅作者可重新上架');
      return;
    }
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({ action: 'republish' }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data.error ?? '操作失败');
      return;
    }
    setListing(data.data);
    show('重新发布成功，已刷新剩余查看次数');
  };

  return (
    <MainLayout>
      <div className="page-section">
        {loading && <p>加载中...</p>}
        {!loading && listing && (
          <>
            <h2>{listing.title}</h2>
            <p style={{ color: 'var(--muted)' }}>{listing.description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '16px 0' }}>
              <div>价格：¥{listing.price}</div>
              <div>剩余查看：{listing.remainingViews}/{listing.viewLimit}</div>
              <div>成交：{listing.totalDeals ?? 0}</div>
              <div>状态：{listing.status === 'active' ? '在售' : '已下架'}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="primary-btn" onClick={purchase} disabled={!tokens}>
                购买联系方式
              </button>
              {user?.id === listing.userId && (
                <button className="secondary-btn" onClick={republish}>
                  重新上架
                </button>
              )}
            </div>
          </>
        )}
        {!loading && !listing && <p>信息不存在或已删除</p>}
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
