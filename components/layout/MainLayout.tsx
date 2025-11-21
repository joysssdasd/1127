import type { ReactNode } from 'react';
import { NewNavbar } from './NewNavbar';

interface NewMainLayoutProps {
  children: ReactNode;
}

export function NewMainLayout({ children }: NewMainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 via-blue-50 to-white">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-300/30 to-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-to-tr from-blue-300/20 to-pink-300/20 rounded-full blur-2xl"></div>
      </div>

      <NewNavbar />
      <main className="relative">
        {children}
      </main>

      {/* 页脚装饰 */}
      <footer className="relative mt-20 bg-gradient-to-t from-purple-100/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">🐮</span>
              </div>
              <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                牛牛基地
              </span>
            </div>
            <p className="text-sm text-gray-500">让每一笔交易都充满信任与便利</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 为了向后兼容，提供 MainLayout 别名
export const MainLayout = NewMainLayout;