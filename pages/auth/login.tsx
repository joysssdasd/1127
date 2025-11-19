import { useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../components/auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';

export default function LoginPage() {
  const { login, tokens } = useAuth();
  const router = useRouter();
  const { message, show } = useToast();
  const [phone, setPhone] = useState('13800000000');
  const [otp, setOtp] = useState('123456');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'start' | 'bind'>('start');

  const startLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/start', { method: 'POST' });
      if (!res.ok) throw new Error('拉取临时票据失败');
      const data = await res.json();
      setSessionToken(data.sessionToken);
      setStep('bind');
      show('授权成功，使用 123456 作为验证码');
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const bindPhone = async () => {
    if (!sessionToken) {
      show('请先完成微信授权');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/bind-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, phone, otp }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '绑定失败');
      const data = await res.json();
      login({ user: data.user, tokens: data.tokens });
      show('登录成功');
      setTimeout(() => router.push('/'), 500);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-section" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>微信 + 手机号 双重登录</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>使用模拟授权 + 验证码完成注册/登录。验证码固定为 123456，便于测试。</p>
        <div className="form-grid">
          <div>
            <label>手机号</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
          </div>
          <div>
            <label>验证码</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="请输入验证码" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-btn" style={{ flex: 1 }} onClick={startLogin} disabled={loading}>
              1. 一键微信授权
            </button>
            <button className="primary-btn" style={{ flex: 1 }} onClick={bindPhone} disabled={loading || step === 'start'}>
              2. 绑定手机号
            </button>
          </div>
          {tokens && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              已登录。若需更换账号，可点击右上角退出再重新登录。
            </div>
          )}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
