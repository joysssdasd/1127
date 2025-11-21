import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const { message, show } = useToast();
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: '',
    wechatId: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
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
          type: 'register',
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

  // 处理表单提交
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!validatePhone(formData.phone)) {
      show('请输入正确的手机号码');
      return;
    }

    if (!formData.smsCode.trim()) {
      show('请输入短信验证码');
      return;
    }

    if (!formData.wechatId.trim()) {
      show('请输入微信号');
      return;
    }

    if (formData.password.length < 6) {
      show('密码至少需要6位字符');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      show('两次密码输入不一致');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          smsCode: formData.smsCode,
          wechatId: formData.wechatId.trim(),
          password: formData.password,
          inviteCode: formData.inviteCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '注册失败');
      }

      show('注册成功！');
      // 延迟跳转到登录页
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (error) {
      show((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, show, router]);

  // 更新表单数据
  const updateForm = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-black">🐮 牛牛基地</Link>
            <Link href="/auth/login" className="text-sm font-medium text-blue-600">
              已有账号？登录
            </Link>
          </div>
        </div>
      </nav>

      {/* 注册表单 */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账号</h1>
            <p className="text-gray-600 text-sm">加入牛牛基地，开启您的交易之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* 验证码 */}
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

            {/* 微信号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                微信号 <span className="text-red-500">*</span>
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

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateForm('password', e.target.value)}
                placeholder="请输入密码（至少6位）"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateForm('confirmPassword', e.target.value)}
                placeholder="请再次输入密码"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {/* 邀请码（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邀请码 <span className="text-gray-400">（选填）</span>
              </label>
              <input
                type="text"
                value={formData.inviteCode}
                onChange={(e) => updateForm('inviteCode', e.target.value)}
                placeholder="请输入邀请码（可获得积分奖励）"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

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
              {submitting ? '注册中...' : '立即注册'}
            </button>
          </form>

          {/* 服务条款 */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>点击注册即表示您同意</p>
            <div className="space-x-2">
              <Link href="/terms" className="text-blue-600 hover:underline">《服务条款》</Link>
              <span>和</span>
              <Link href="/privacy" className="text-blue-600 hover:underline">《隐私政策》</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      <Toast message={message} />
    </div>
  );
};

export default RegisterPage;
