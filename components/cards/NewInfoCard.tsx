import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../auth/AuthContext';
import type { ListingPayload } from '../../backend/shared/contracts/listing';
import { EdgeOneOptimizedImage } from '../ui/EdgeOneOptimizedImage';

interface InfoCardProps {
  listing: ListingPayload;
  compact?: boolean;
}

// 交易类型配置
const TRADE_TYPE_CONFIG = {
  sell: { label: '出售', color: 'text-green-700', bgColor: 'bg-green-50' },
  buy: { label: '求购', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  exchange: { label: '交换', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  service: { label: '服务', color: 'text-orange-700', bgColor: 'bg-orange-50' },
};

export function NewInfoCard({ listing, compact = false }: InfoCardProps) {
  const { tokens } = useAuth();

  const { label, color, bgColor } = TRADE_TYPE_CONFIG[listing.tradeType] || TRADE_TYPE_CONFIG.sell;

  const handlePurchaseContact = async () => {
    if (!tokens) {
      alert('请先登录后再解锁联系方式');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ postId: listing.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '解锁失败');
      }

      alert(`已解锁微信：${data.data.contact}`);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div className={`group relative overflow-hidden transition-all duration-300 ${
      compact
        ? 'bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 border border-purple-100'
        : 'bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-purple-100'
    }`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-pink-50/30 pointer-events-none"></div>

      {/* 顶部状态栏 */}
      <div className={`relative flex items-center justify-between p-4 border-b border-purple-50 ${compact ? 'pb-3' : 'pb-4'}`}>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 text-xs font-bold ${color} ${bgColor} rounded-full shadow-sm`}>
            {label}
          </div>
          {listing.status === 'active' ? (
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">在售</span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">已下架</span>
          )}
        </div>
        {listing.remainingViews !== undefined && (
          <div className="flex items-center space-x-1 text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-medium">
              {listing.remainingViews}/{listing.viewLimit}
            </span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className={`relative p-4 ${compact ? 'pb-3' : 'pb-4'}`}>
        {/* 标题和描述 */}
        <Link href={`/listings/${listing.id}`} className="block group">
          <h3 className={`font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-700 transition-colors ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {listing.title}
          </h3>
          <p className={`text-gray-600 line-clamp-2 mb-4 group-hover:text-gray-700 transition-colors ${
            compact ? 'text-xs' : 'text-sm'
          }`}>
            {listing.description}
          </p>
        </Link>

        {/* 图片展示 */}
        {listing.images && listing.images.length > 0 && (
          <div className="relative mb-4 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            <EdgeOneOptimizedImage
              src={listing.images[0] || ''}
              alt={listing.title}
              className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
              fallbackSrc="/api/placeholder/image.jpg"
            />
            {listing.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                📷 +{listing.images.length - 1}
              </div>
            )}
          </div>
        )}

        {/* 价格和成交信息 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                ¥{listing.price}
              </span>
              {listing.originalPrice && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">
                    ¥{listing.originalPrice}
                  </span>
                  {listing.originalPrice > listing.price && (
                    <span className="text-xs text-green-600 font-medium">
                      省¥{listing.originalPrice - listing.price}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {listing.totalDeals > 0 && (
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold">成交{listing.totalDeals}次</span>
            </div>
          )}
        </div>

        {/* 标签 */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg border border-purple-200"
              >
                #{tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="px-2.5 py-1 text-xs font-medium text-gray-500">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部操作区 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-400 text-xs">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {formatDistanceToNow(new Date(listing.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/listings/${listing.id}`}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              📄 查看详情
            </Link>
            <button
              onClick={handlePurchaseContact}
              disabled={!tokens || listing.status !== 'active'}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 transform hover:scale-105 ${
                !tokens || listing.status !== 'active'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg'
              }`}
            >
              💬 解锁微信
            </button>
          </div>
        </div>
      </div>

      {/* 悬浮效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}