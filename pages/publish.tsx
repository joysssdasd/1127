import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function PublishPage() {
  const { tokens, user } = useAuth();
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
    if (!title.trim() || !description.trim()) {
      show('请完整填写标题和描述');
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
        body: JSON.stringify({
          title,
          description,
          price,
          tradeType,
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          aiAssist,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '发布失败');
      }
      show('发布成功，等待买家解锁微信');
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
      <div className="page-section">
        <div className="section-heading">发布信息</div>
        <p className="section-subtitle">所有信息默认 72 小时下架，再次上架会刷新剩余查看次数。</p>
        <div className="grid-three">
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>微信默认透出</h3>
            <p style={{ color: 'var(--muted)' }}>
              当前绑定微信：{user?.wechat ?? '未设置'} ·{' '}
              <Link href="/me" style={{ color: '#0a84ff' }}>
                去个人中心更新
              </Link>
            </p>
          </div>
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>AI 补充文案</h3>
            <p style={{ color: 'var(--muted)' }}>勾选 AI 辅助即可自动生成标签与卖点，提升曝光率。</p>
          </div>
          <div className="feature-card">
            <h3 style={{ marginTop: 0 }}>积分激励</h3>
            <p style={{ color: 'var(--muted)' }}>成交后积分自动返还，积分流水可在后台&个人中心查询。</p>
          </div>
        </div>
      </div>

      <div className="page-section" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="form-grid">
          <div>
            <label>标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：全新 iPhone 16 Pro 现货" />
          </div>
          <div>
            <label>描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="请写明配置、成色、交易方式、城市等关键信息" />
          </div>
          <div>
            <label>价格（积分）</label>
            <input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label>交易类型</label>
            <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
              <option value="sell">出售</option>
              <option value="buy">求购</option>
              <option value="trade">互换</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label>关键词（逗号分隔）</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="苹果, 信义区, 面交" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={aiAssist} onChange={(e) => setAiAssist(e.target.checked)} />
            <span>开启 AI 辅助写作</span>
          </div>
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? '发布中...' : '发布并扣除 10 次查看额度'}
          </button>
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
