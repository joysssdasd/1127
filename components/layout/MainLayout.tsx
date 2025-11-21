import type { ReactNode } from 'react';
import { NewNavbar } from './NewNavbar';

interface NewMainLayoutProps {
  children: ReactNode;
}

export function NewMainLayout({ children }: NewMainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      <main>
        {children}
      </main>
      <footer className="mt-auto py-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-sm text-gray-600">
            <div className="mb-2">🐮 牛牛基地</div>
            <p>信息交易平台</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 为了向后兼容，提供 MainLayout 别名
export const MainLayout = NewMainLayout;