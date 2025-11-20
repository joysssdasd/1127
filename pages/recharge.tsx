import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

const steps = [
  { title: '提交充值金额', description: '积分与人民币 1:1 计价，最低 10 起充。' },
  { title: '上传凭证链接', description: '支持截图图床、网盘、对象存储地址。' },
  { title: '管理员审核', description: '管理员通过短信验证码登录后台处理。' },
];

export default function RechargePage() {
  const { tokens } = useAuth();
  const { message, show } = useToast();
  const [amount, setAmount] = useState(100);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!tokens) {
      show('请先登录');
      return;
    }
    if (!voucherUrl.trim()) {
      show('请填写凭证链接');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ amount, voucherUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '提交失败');
      }
      show('已提交，请等待管理员短信提醒');
      setVoucherUrl('');
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-section">
        <div className="section-heading">积分充值</div>
        <p className="section-subtitle">短信通道由 SPUG 提供，targets 参数可精确指定管理员手机号。</p>
        <div className="grid-three">
          {steps.map((step) => (
            <div key={step.title} className="feature-card">
              <h3 style={{ marginTop: 0 }}>{step.title}</h3>
              <p style={{ color: 'var(--muted)' }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="page-section" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="form-grid">
          <div>
            <label>金额 / 积分</label>
            <input type="number" min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label>凭证链接</label>
            <input value={voucherUrl} onChange={(e) => setVoucherUrl(e.target.value)} placeholder="https://example.com/voucher.png" />
            <p className="form-note">截图可上传至图床后粘贴地址，管理员审核后自动入账。</p>
          </div>
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? '提交中...' : '提交审核'}
          </button>
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
