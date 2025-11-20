import { useEffect, useState } from 'react';
import type { ListingSearchResult } from '../backend/shared/contracts/search';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

const quickFilters = ['教育', '企业服务', '供应链', '快消', '房源'];

export default function SearchPage() {
  const { tokens } = useAuth();
  const { message, show } = useToast();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ListingSearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!tokens) return;
    const res = await fetch('/api/search/history', { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
    const data = await res.json();
    setHistory(data.data ?? []);
  };

  useEffect(() => {
    loadHistory();
  }, [tokens]);

  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    const handler = window.setTimeout(async () => {
      const authHeaders = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined;
      const res = await fetch(`/api/search/suggestions?prefix=${encodeURIComponent(keyword.trim())}`, authHeaders ? { headers: authHeaders } : undefined);
      const data = await res.json();
      setSuggestions(data.data?.suggestions ?? []);
    }, 250);
    return () => window.clearTimeout(handler);
  }, [keyword, tokens]);

  const runSearch = async (value?: string) => {
    const q = value ?? keyword;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const authHeaders = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined;
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(q.trim())}`, authHeaders ? { headers: authHeaders } : undefined);
      const data = await res.json();
      setResults(data.data ?? []);
      loadHistory();
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!tokens) return;
    await fetch('/api/search/history', { method: 'DELETE', headers: { Authorization: `Bearer ${tokens.accessToken}` } });
    setHistory([]);
  };

  return (
    <MainLayout>
      <div className="page-section">
        <div className="section-heading">智能搜索</div>
        <p className="section-subtitle">历史记录、AI 联想与人工推荐相结合，适合在移动端下拉刷新使用。</p>
        <div className="input-row" style={{ marginBottom: 16 }}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="输入关键词、品牌或城市" style={{ flex: 1 }} />
          <button className="primary-btn" onClick={() => runSearch()} disabled={loading}>
            {loading ? '检索中...' : '搜索'}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="form-note">智能联想</div>
            <div className="list-card-actions">
              {suggestions.map((item) => (
                <button key={item} className="secondary-btn" onClick={() => runSearch(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="form-note">热门筛选</div>
        <div className="list-card-actions">
          {quickFilters.map((item) => (
            <button key={item} className="secondary-btn" onClick={() => runSearch(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="page-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-heading" style={{ marginBottom: 0 }}>
              历史记录
            </div>
            <button className="secondary-btn" onClick={clearHistory}>
              清空
            </button>
          </div>
          <div className="list-card-actions" style={{ marginTop: 16 }}>
            {history.map((item) => (
              <button key={item} className="secondary-btn" onClick={() => runSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="page-section">
        <div className="section-heading">搜索结果</div>
        {results.length === 0 && !loading && <p style={{ color: 'var(--muted)' }}>暂无结果，换个维度试试。</p>}
        <div className="listing-grid">
          {results.map((item) => (
            <div key={item.id} className="list-card">
              <div className="meta-row">
                <span className="chip">成交 {item.totalDeals ?? 0} 次</span>
                <span className="chip emphasis">剩余 {item.remainingViews} 次</span>
              </div>
              <h3>{item.title}</h3>
              <div className="meta-row">
                <span className="badge">
                  <strong>价格</strong> ¥{item.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
