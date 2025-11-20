import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/publish', label: '发布' },
  { href: '/search', label: '智能搜索' },
  { href: '/recharge', label: '积分充值' },
  { href: '/me', label: '个人中心' },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <header className="app-header">
        <div>
          <div className="app-brand">C2C 情报局</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>72 小时自动下架 · 智能风控撮合 · Supabase 实时底座</div>
        </div>
        <nav className="app-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(link.href) ? 'active' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="user-chip">
          {user ? (
            <>
              <div>
                <div style={{ fontWeight: 600 }}>{user.phone ?? '未绑定手机'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  微信：{user.wechat ?? '未设置'} · 积分 {user.points ?? 0}
                </div>
              </div>
              <button className="secondary-btn" onClick={logout}>
                退出
              </button>
            </>
          ) : (
            <Link className="primary-btn" href="/auth/login">
              登录 / 入驻
            </Link>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto 60px', padding: '0 8px' }}>{children}</main>
    </div>
  );
}
