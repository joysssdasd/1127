import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

const links = [
  { href: '/', label: '首页' },
  { href: '/publish', label: '发布信息' },
  { href: '/search', label: '智能搜索' },
  { href: '/recharge', label: '积分充值' },
  { href: '/me', label: '个人中心' },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 36px',
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>C2C Info Hub</span>
          <span style={{ marginLeft: 12, color: 'var(--muted)', fontSize: 13 }}>积分撮合 · 实时撮达</span>
        </div>
        <nav style={{ display: 'flex', gap: 18 }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} style={{ fontSize: 14, color: 'var(--muted)' }}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.phone ?? '未绑定手机号'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>积分 {user.points ?? 0}</div>
              </div>
              <button className="secondary-btn" onClick={logout}>
                退出
              </button>
            </>
          ) : (
            <Link className="primary-btn" href="/auth/login">
              登录/注册
            </Link>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '36px auto', padding: '0 20px' }}>{children}</main>
    </div>
  );
}
