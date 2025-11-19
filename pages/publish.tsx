import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function PublishPage() {
  const { tokens } = useAuth();
  const { message, show } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(100);
  const [tradeType, setTradeType] = useState('sell');
  const [keywords, setKeywords] = useState('');
  const [aiAssist, setAiAssist] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!tokens) {
      show('请先登录');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ title, description, price, tradeType, keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean), aiAssist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '发布失败');
      show('发布成功，等待买家购买联系方式');
      setTitle('');
      setDescription('');
      setKeywords('');
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-section" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2>发布交易信息</h2>
        <div className="form-grid">
          <div>
            <label>标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：深圳闲置显卡低价出售" />
          </div>
          <div>
            <label>描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="填写货品、成色、交易方式等详细信息" />
          </div>
          <div>
            <label>价格</label>
            <input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label>交易类型</label>
            <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
              <option value="sell">出售</option>
              <option value="buy">求购</option>
              <option value="trade">置换</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label>关键词（逗号分隔，可选）</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="闲置, 显卡, 包邮" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={aiAssist} onChange={(e) => setAiAssist(e.target.checked)} />
            <span>启用 AI 关键词扩展</span>
          </div>
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? '发布中...' : '发布并扣除10积分'}
          </button>
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
