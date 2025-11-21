import type { ReactNode } from 'react';
import { NewNavbar } from './NewNavbar';

interface NewMainLayoutProps {
  children: ReactNode;
}

export function NewMainLayout({ children }: NewMainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      <main className="max-w-full px-0">
        {children}
      </main>
    </div>
  );
}

// 为了向后兼容，提供 MainLayout 别名
export const MainLayout = NewMainLayout;