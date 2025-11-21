import React from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';

interface NavbarProps {
  transparent?: boolean;
}

export function NewNavbar({ transparent = false }: NavbarProps) {
  const { user } = useAuth();

  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-gray-200 ${
      transparent ? 'bg-white/95 backdrop-blur-sm' : 'bg-white'
    }`}>
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-black">🐮 牛牛基地</span>
          </Link>

          {/* 右侧按钮 */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Link
                  href="/publish"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
                >
                  发布信息
                </Link>
                <Link
                  href="/me"
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  我的
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-black border border-black rounded-lg hover:bg-black hover:text-white"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}