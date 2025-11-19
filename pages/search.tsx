import { useEffect, useState } from 'react';
import type { ListingSearchResult } from '../backend/shared/contracts/search';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

export default function SearchPage() {
  const { tokens } = useAuth();
  const { message, show } = useToast();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ListingSearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
      const res = await fetch(
        `/api/search/suggestions?prefix=${encodeURIComponent(keyword.trim())}${tokens ? `&user=${tokens.accessToken}` : ''}`,
        authHeaders ? { headers: authHeaders } : undefined,
      );
      const data = await res.json();
      setSuggestions(data.data?.suggestions ?? []);
    }, 250);
    return () => window.clearTimeout(handler);
  }, [keyword, tokens]);

  const runSearch = async (value?: string) => {
    const q = value ?? keyword;
    if (!q.trim()) return;
    const authHeaders = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined;
    const res = await fetch(
      `/api/search?keyword=${encodeURIComponent(q.trim())}`,
      authHeaders ? { headers: authHeaders } : undefined,
    );
    const data = await res.json();
    setResults(data.data ?? []);
    loadHistory();
  };

  const clearHistory = async () => {
    if (!tokens) return;
    await fetch('/api/search/history', { method: 'DELETE', headers: { Authorization: `Bearer ${tokens.accessToken}` } });
    setHistory([]);
  };

  return (
    <MainLayout>
      <div className="page-section">
        <h2>智能搜索</h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="输入关键字，支持模糊/拼音" style={{ flex: 1 }} />
          <button className="primary-btn" onClick={() => runSearch()}>
            搜索
          </button>
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
            热门：{' '}
            {suggestions.map((item) => (
              <button key={item} className="secondary-btn" onClick={() => runSearch(item)} style={{ marginRight: 8 }}>
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="page-section">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>历史记录</h3>
            <button className="secondary-btn" onClick={clearHistory}>
              清空
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.map((item) => (
              <button key={item} className="secondary-btn" onClick={() => runSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="page-section">
        <h3>匹配结果</h3>
        {results.length === 0 && <p style={{ color: 'var(--muted)' }}>暂无结果，可尝试切换关键词。</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          {results.map((item) => (
            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>剩余查看 {item.remainingViews}</div>
                </div>
                <div>¥{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
