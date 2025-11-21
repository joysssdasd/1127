import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';

interface NavbarProps {
  transparent?: boolean;
}

export function NewNavbar({ transparent = false }: NavbarProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`sticky top-0 z-50 w-full ${
      transparent
        ? 'bg-gradient-to-r from-purple-50/90 via-pink-50/90 to-blue-50/90 backdrop-blur-md border-b border-purple-100'
        : 'bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b border-purple-100'
    } shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white text-xl font-bold">🐮</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                牛牛基地
              </span>
              <div className="text-xs text-gray-500 hidden sm:block">信息交易平台</div>
            </div>
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/search"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                >
                  🔍 探索
                </Link>
                <Link
                  href="/publish"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  ✨ 发布信息
                </Link>
                <Link
                  href="/me"
                  className="group flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.phone ? user.phone.slice(-2) : 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:block">我的</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/search"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                >
                  探索
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all duration-200"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  立即注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-purple-50 transition-colors"
            >
              <div className="space-y-1.5">
                <div className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                <div className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                <div className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-100">
            <div className="flex flex-col space-y-3">
              <Link
                href="/search"
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                🔍 探索发现
              </Link>
              {user ? (
                <>
                  <Link
                    href="/publish"
                    className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✨ 发布信息
                  </Link>
                  <Link
                    href="/me"
                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 个人中心
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    登录账号
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    立即注册
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}