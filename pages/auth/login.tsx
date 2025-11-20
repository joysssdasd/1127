import { useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../components/auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';

type Mode = 'password' | 'sms';

const MODES: Array<{ key: Mode; label: string }> = [
  { key: 'password', label: '密码登录' },
  { key: 'sms', label: '短信 + 密码' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, tokens } = useAuth();
  const { message, show } = useToast();

  const [mode, setMode] = useState<Mode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [wechat, setWechat] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!phone.trim()) {
      show('请输入手机号');
      return;
    }
    if (!wechat.trim()) {
      show('请输入微信号以便成交后展示给买家');
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
      if (!res.ok) {
        throw new Error(data.error ?? '验证码发送失败');
      }
      show('验证码已发送');
      setCountdown(60);
      const timer = window.setInterval(() => {
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
    if (!phone.trim()) {
      show('请输入手机号');
      return;
    }
    if (!password.trim()) {
      show('请输入密码');
      return;
    }
    if (mode === 'sms') {
      if (!code.trim()) {
        show('请输入短信验证码');
        return;
      }
      if (!wechat.trim()) {
        show('请输入微信号');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        phone: phone.trim(),
        password: password,
      };
      if (wechat.trim()) {
        payload.wechat = wechat.trim();
      }
      if (mode === 'sms') {
        payload.code = code.trim();
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '登录失败');
      }
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
      <div className="page-section">
        <div className="auth-grid">
          <div className="auth-hero">
            <div className="chip emphasis">统一入口</div>
            <h1 style={{ marginTop: 12, marginBottom: 8 }}>短信 + 密码双通道</h1>
            <p style={{ maxWidth: 360, opacity: 0.9 }}>
              默认使用密码保持高频登录，首次入驻或管理员账号需切换短信模式完成一次实名校验。
            </p>
            <ul style={{ marginTop: 24, lineHeight: 1.8 }}>
              <li>管理员（13011319329 / 13001220766）仅支持短信方式进入后台</li>
              <li>短信通道由 SPUG 提供，支持 targets 动态指定推送对象</li>
              <li>完成首次登录即自动绑定微信联系方式，撮合时直接透出</li>
            </ul>
          </div>
          <div className="auth-card">
            <h2 style={{ marginTop: 0 }}>进入情报局</h2>
            <p className="form-note">管理员默认跳转后台；普通用户可在此完成注册、登录与微信绑定。</p>
            <div className="tab-switch">
              {MODES.map((item) => (
                <button key={item.key} className={mode === item.key ? 'active' : undefined} onClick={() => setMode(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
            {mode === 'sms' && <p className="form-note">短信模式会自动注册账户并同步微信号，适合首次入驻或忘记密码。</p>}
            <div className="form-grid">
              <div>
                <label>手机号</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入 11 位手机号" />
              </div>
              <div>
                <label>微信号</label>
                <input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="用于成交后展示给买家" />
              </div>
              {mode === 'sms' && (
                <div>
                  <label>短信验证码</label>
                  <div className="input-row">
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 位验证码" />
                    <button className="secondary-btn" type="button" onClick={sendCode} disabled={sending || countdown > 0}>
                      {countdown > 0 ? `${countdown}s` : '发送验证码'}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label>密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" />
                <p className="form-note">默认采用密码登录；短信模式可同步重置密码。</p>
              </div>
              <button className="primary-btn" onClick={handleLogin} disabled={loading}>
                {loading ? '正在处理...' : mode === 'sms' ? '短信校验后进入' : '立即进入'}
              </button>
              {tokens && <p className="form-note">已经在其他标签登录，可直接切换页面使用。</p>}
            </div>
          </div>
        </div>
      </div>
      <Toast message={message} />
    </MainLayout>
  );
}
