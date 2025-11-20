import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ListingPayload } from '../backend/shared/contracts/listing';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

type Announcement = {
  id: string;
  title: string;
  description: string;
  tag: string;
  publishedAt: string;
};

const featureHighlights = [
  { title: '72 小时自动下架', description: '超时信息自动回收，保持信息池纯净，避免买家踩坑。' },
  { title: 'AI 语义打标', description: '发布时自动生成标签与补充描述，方便搜索与风控审核。' },
  { title: '积分可追溯', description: '每一次充值、扣减、成交都在积分账本中留痕，可随时导出。' },
];

export default function HomePage() {
  const { tokens, user } = useAuth();
  const { message, show } = useToast();
  const [listings, setListings] = useState<ListingPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadListings = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const query = kw ? `?keyword=${encodeURIComponent(kw)}` : '';
      const res = await fetch(`/api/listings${query}`);
      const data = await res.json();
      setListings(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.data ?? []))
      .catch(() => {});
  }, []);

  const refreshFeed = useCallback(async () => {
    await loadListings(keyword.trim() || undefined);
  }, [keyword, loadListings]);

  const pull = usePullToRefresh(refreshFeed);

  const runSearch = async () => {
    if (!keyword.trim()) {
      loadListings();
      return;
    }
    setSearching(true);
    try {
      await loadListings(keyword.trim());
    } finally {
      setSearching(false);
    }
  };

  const purchaseContact = async (id: string) => {
    if (!tokens) {
      show('请先登录后再解锁微信联系方式');
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
      if (!res.ok) {
        throw new Error(data.error ?? '解锁失败');
      }
      show(`已解锁微信：${data.data.contact}`);
    } catch (error) {
      show((error as Error).message);
    }
  };

  const stats = useMemo(() => {
    const totalDeals = listings.reduce((acc, item) => acc + (item.totalDeals ?? 0), 0);
    const totalViews = listings.reduce((acc, item) => acc + (item.remainingViews ?? 0), 0);
    return [
      { label: '在架信息', value: listings.length },
      { label: '累计成交', value: totalDeals },
      { label: '剩余可查看次数', value: totalViews },
    ];
  }, [listings]);

  const heroChips = [
    `管理后台自动跳转：${user?.phone ? '已绑定' : '待完善'}`,
    '管理员仅限短信通道',
    'SPUG targets 动态推送',
  ];

  return (
    <MainLayout>
      {(pull.pulling || pull.refreshing) && (
        <div className="pull-indicator">
          {pull.refreshing ? '正在同步最新撮合数据...' : `下拉刷新 ${Math.min(100, Math.round((pull.distance / 90) * 100))}%`}
        </div>
      )}
      <div className="page-section hero">
        <div className="hero-content">
          <div className="chip emphasis">Apple 风格 · 移动优先</div>
          <h1 style={{ marginTop: 16, marginBottom: 12 }}>即时 C2C 情报中枢</h1>
          <p style={{ fontSize: 17 }}>
            72 小时自动下架、AI 风控打标、积分全链路可追溯，让买卖双方以微信联系为核心进行快速撮合。
          </p>
          <div className="cta-stack">
            <Link className="primary-btn" href={tokens ? '/publish' : '/auth/login'}>
              {tokens ? '立即发布' : '登录并发布'}
            </Link>
            <Link className="secondary-btn" href="/search">
              智能搜索
            </Link>
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {heroChips.map((item) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">实时信息</div>
        <p className="section-subtitle">支持关键词检索，历史搜索会沉淀在个人中心，便于快速回看。</p>
        <div className="input-row" style={{ marginBottom: 20 }}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="请输入关键词 / 行业 / 城市" style={{ flex: 1 }} />
          <button className="primary-btn" onClick={runSearch} disabled={searching}>
            {searching ? '检索中...' : '搜索'}
          </button>
        </div>
        <div className="listing-grid">
          {listings.map((listing) => (
            <div key={listing.id} className="list-card">
              <div className="meta-row">
                <span className="chip">{listing.tradeType === 'sell' ? '出售' : listing.tradeType === 'buy' ? '求购' : '其他'}</span>
                <span className="chip emphasis">剩余 {listing.remainingViews}/{listing.viewLimit} 次</span>
              </div>
              <h3>{listing.title}</h3>
              <p style={{ margin: '8px 0', color: 'var(--muted)' }}>{listing.description}</p>
              <div className="meta-row">
                <span className="badge">
                  <strong>价格</strong> ¥{listing.price}
                </span>
                <span className="badge">成交 {listing.totalDeals ?? 0} 次</span>
                <span className="badge">{listing.status === 'active' ? '在售' : '已下架'}</span>
              </div>
              <div className="list-card-actions">
                <Link className="secondary-btn" href={`/listings/${listing.id}`}>
                  查看详情
                </Link>
                <button className="primary-btn" disabled={!tokens || listing.status !== 'active'} onClick={() => purchaseContact(listing.id)}>
                  解锁微信
                </button>
              </div>
            </div>
          ))}
        </div>
        {loading && <p style={{ textAlign: 'center', marginTop: 16 }}>正在同步数据...</p>}
        {!loading && listings.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 16 }}>暂无匹配数据，尝试换个关键词或直接发布。</p>}
      </div>

      <div className="page-section">
        <div className="section-heading">平台亮点</div>
        <div className="grid-three">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="feature-card">
              <h3 style={{ marginTop: 0 }}>{feature.title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <div className="section-heading">系统公告</div>
        <p className="section-subtitle">运营、风控、短信通道等重要更新会在此推送，管理员也可在后台查看完整日志。</p>
        <div className="grid-three">
          {announcements.map((item) => (
            <div key={item.id} className="announcement-card">
              <div className="announcement-tag">{item.tag}</div>
              <h3 style={{ margin: '6px 0' }}>{item.title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{item.description}</p>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(item.publishedAt).toLocaleString()}</span>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无公告，敬请期待下一次更新。</p>}
        </div>
      </div>

      <Toast message={message} />
    </MainLayout>
  );
}
