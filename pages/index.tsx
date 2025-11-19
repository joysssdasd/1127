import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ListingPayload } from '../backend/shared/contracts/listing';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

export default function HomePage() {
  const { tokens, user } = useAuth();
  const { message, show } = useToast();
  const [listings, setListings] = useState<ListingPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);

  const loadListings = async (kw?: string) => {
    setLoading(true);
    try {
      const query = kw ? `?keyword=${encodeURIComponent(kw)}` : '';
      const res = await fetch(`/api/listings${query}`);
      const data = await res.json();
      setListings(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const runSearch = async () => {
    if (!keyword.trim()) return loadListings();
    setSearching(true);
    try {
      await loadListings(keyword.trim());
      const authHeaders = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined;
      await fetch(`/api/search?keyword=${encodeURIComponent(keyword.trim())}`, authHeaders ? { headers: authHeaders } : undefined);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const purchaseContact = async (id: string) => {
    if (!tokens) {
      show('请先登录后再获取联系方式');
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '购买失败');
      show(`购买成功，凭证 ${data.data.contactToken}`);
    } catch (error) {
      show((error as Error).message);
    }
  };

  const stats = useMemo(() => {
    const totalDeals = listings.reduce((acc, item) => acc + (item.totalDeals ?? 0), 0);
    const totalViews = listings.reduce((acc, item) => acc + (item.remainingViews ?? 0), 0);
    return [
      { label: '在线信息', value: listings.length },
      { label: '累计成交', value: totalDeals },
      { label: '剩余查看额度', value: totalViews },
    ];
  }, [listings]);

  return (
    <MainLayout>
      <div className="page-section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ margin: 0 }}>交易信息撮合平台</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 600 }}>以积分驱动的C2C信息集市，支持72小时自动下架、成交率信用、关键词搜索和AI辅助发布。</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 24 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标题 / 描述 / 关键词" style={{ flex: 1, borderRadius: 999, padding: '12px 20px', border: '1px solid var(--border)' }} />
          <button className="primary-btn" onClick={runSearch} disabled={searching}>
            {searching ? '搜索中...' : '智能搜索'}
          </button>
          <Link className="secondary-btn" href="/publish">
            发布信息
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          {listings.map((listing) => (
            <div key={listing.id} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 20, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{listing.title}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>{listing.description}</p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                    <span>¥{listing.price}</span>
                    <span>剩余 {listing.remainingViews}/{listing.viewLimit} 次查看</span>
                    <span>成交 {listing.totalDeals ?? 0} 次</span>
                    <span>状态 {listing.status === 'active' ? '在售' : '已下架'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link className="secondary-btn" href={`/listings/${listing.id}`}>
                    查看详情
                  </Link>
                  <button className="primary-btn" onClick={() => purchaseContact(listing.id)} disabled={!tokens || listing.status !== 'active'}>
                    购买联系方式
                  </button>
                </div>
              </div>
            </div>
          ))}
          {listings.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>暂无数据，试着搜索或发布一条吧。</p>}
          {loading && <p style={{ textAlign: 'center' }}>加载中...</p>}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
