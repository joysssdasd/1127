import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useAuth } from '../../components/auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';

type LoginMode = 'password' | 'sms';

const LOGIN_MODES: Array<{ key: LoginMode; label: string; description: string }> = [
  {
    key: 'password',
    label: '密码登录',
    description: '高效便捷，适合经常登录的用户'
  },
  {
    key: 'sms',
    label: '验证码登录',
    description: '安全可靠，适合首次登录或忘记密码'
  },
];

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { login, tokens } = useAuth();
  const { message, show } = useToast();

  const [mode, setMode] = useState<LoginMode>('password');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    smsCode: '',
    wechatId: '',
  });
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 验证手机号格式
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送短信验证码
  const handleSendSmsCode = useCallback(async () => {
    if (!validatePhone(formData.phone)) {
      show('请输入正确的手机号码');
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          type: 'login',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '发送验证码失败');
      }

      show('验证码已发送');
      setCountdown(60);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSendingCode(false);
    }
  }, [formData.phone, show]);

  // 处理登录
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!validatePhone(formData.phone)) {
      show('请输入正确的手机号码');
      return;
    }

    if (mode === 'password' && !formData.password.trim()) {
      show('请输入密码');
      return;
    }

    if (mode === 'sms' && !formData.smsCode.trim()) {
      show('请输入短信验证码');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        phone: formData.phone,
      };

      // 根据模式发送不同的认证数据
      if (mode === 'password') {
        payload.password = formData.password;
        if (formData.wechatId.trim()) {
          payload.wechat = formData.wechatId.trim();
        }
      } else {
        payload.smsCode = formData.smsCode;
        if (formData.wechatId.trim()) {
          payload.wechat = formData.wechatId.trim();
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }

      login({
        user: data.user,
        tokens: data.tokens,
        isAdmin: data.isAdmin
      });

      show('登录成功！');

      // 延迟跳转，给用户时间看到成功提示
      setTimeout(() => {
        if (data.isAdmin) {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      }, 1000);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, mode, login, router, show]);

  // 更新表单数据
  const updateForm = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 如果已经登录，直接跳转
  useEffect(() => {
    if (tokens) {
      router.replace('/');
    }
  }, [tokens, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-black">🐮 牛牛基地</Link>
            <Link href="/auth/register" className="text-sm font-medium text-blue-600">
              还没有账号？注册
            </Link>
          </div>
        </div>
      </nav>

      {/* 登录表单 */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
            <p className="text-gray-600 text-sm">登录牛牛基地，继续您的交易之旅</p>
          </div>

          {/* 登录模式切换 */}
          <div className="bg-white rounded-lg p-1 mb-6 flex border border-gray-200">
            {LOGIN_MODES.map((loginMode) => (
              <button
                key={loginMode.key}
                onClick={() => setMode(loginMode.key)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  mode === loginMode.key
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {loginMode.label}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-700">
              {LOGIN_MODES.find(m => m.key === mode)?.description}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {/* 微信号（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                微信号 <span className="text-gray-400">（选填，用于交易联系）</span>
              </label>
              <input
                type="text"
                value={formData.wechatId}
                onChange={(e) => updateForm('wechatId', e.target.value)}
                placeholder="请输入微信号"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {/* 根据模式显示不同的输入框 */}
            {mode === 'password' ? (
              /* 密码输入 */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            ) : (
              /* 验证码输入 */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  短信验证码 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={formData.smsCode}
                    onChange={(e) => updateForm('smsCode', e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={handleSendSmsCode}
                    disabled={sendingCode || countdown > 0 || !validatePhone(formData.phone)}
                    className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                      sendingCode || countdown > 0 || !validatePhone(formData.phone)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                submitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {submitting ? '登录中...' : mode === 'sms' ? '验证码登录' : '密码登录'}
            </button>
          </form>

          {/* 管理员提示 */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">
              <div className="font-medium mb-1">👨‍💼 管理员登录须知</div>
              <div>管理员账号仅支持验证码方式登录，用于后台管理。</div>
            </div>
          </div>

          {/* 还没账号 */}
          <div className="mt-8 text-center text-sm text-gray-600">
            还没有账号？
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium ml-1">
              立即注册
            </Link>
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      <Toast message={message} />
    </div>
  );
};

export default LoginPage;
