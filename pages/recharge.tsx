import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

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
      if (!res.ok) throw new Error(data.error ?? '提交失败');
      show('已提交充值申请，等待管理员审核');
      setVoucherUrl('');
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-section" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2>积分充值</h2>
        <p style={{ color: 'var(--muted)' }}>上传转账凭证链接（可使用图床URL），管理员审核通过后即刻入账。</p>
        <div className="form-grid">
          <div>
            <label>金额（积分）</label>
            <input type="number" min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label>凭证链接</label>
            <input value={voucherUrl} onChange={(e) => setVoucherUrl(e.target.value)} placeholder="https://example.com/voucher.png" />
          </div>
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
