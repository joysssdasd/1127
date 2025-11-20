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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!phone) {
      show('请输入手机号');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '发送失败');
      show('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password || !code) {
      show('请完整填写信息');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '登录失败');
      login({ user: data.user, tokens: data.tokens, isAdmin: data.isAdmin });
      show('登录成功');
      if (data.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    } catch (error) {
      show((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-section" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>短信 + 密码登录</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>验证码用于校验手机号归属，密码用于日常登录和敏感操作确认。</p>
        <div className="form-grid">
          <div>
            <label>手机号</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
          </div>
          <div>
            <label>短信验证码</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6位验证码" style={{ flex: 1 }} />
              <button className="secondary-btn" type="button" onClick={sendCode} disabled={sending || countdown > 0}>
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>
          <div>
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位" />
          </div>
          <button className="primary-btn" onClick={handleLogin} disabled={loading}>
            {loading ? '登录中...' : '登录 / 注册'}
          </button>
          {tokens && <p style={{ fontSize: 13, color: 'var(--muted)' }}>已登录，如需切换账号请先退出。</p>}
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
