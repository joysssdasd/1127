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
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow ${
      compact ? 'p-3' : 'p-4'
    }`}>
      {/* 顶部标签行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium ${color} ${bgColor} rounded-full`}>
            {label}
          </span>
          <span className={`text-xs ${listing.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
            {listing.status === 'active' ? '在售' : '已下架'}
          </span>
        </div>
        {listing.remainingViews !== undefined && (
          <span className="text-xs text-gray-500">
            查看 {listing.remainingViews}/{listing.viewLimit} 次
          </span>
        )}
      </div>

      {/* 标题和描述 */}
      <Link href={`/listings/${listing.id}`} className="block">
        <h3 className={`font-medium text-gray-900 line-clamp-1 ${compact ? 'text-sm' : 'text-base'} mb-1 hover:text-blue-600 transition-colors`}>
          {listing.title}
        </h3>
        <p className={`text-gray-600 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'} mb-3`}>
          {listing.description}
        </p>
      </Link>

      {/* 图片展示 */}
      {listing.images && listing.images.length > 0 && (
        <div className="relative mb-3">
          <EdgeOneOptimizedImage
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-32 object-cover rounded-md"
            fallbackSrc="/api/placeholder/image.jpg"
          />
          {listing.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              +{listing.images.length - 1}
            </div>
          )}
        </div>
      )}

      {/* 价格和交易信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-red-600">
            ¥{listing.price}
          </span>
          {listing.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ¥{listing.originalPrice}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {listing.totalDeals > 0 && (
            <span>成交{listing.totalDeals}次</span>
          )}
        </div>
      </div>

      {/* 标签 */}
      {listing.tags && listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {listing.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部操作区 */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(listing.createdAt), {
            addSuffix: true,
            locale: zhCN,
          })}
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/listings/${listing.id}`}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            详情
          </Link>
          <button
            onClick={handlePurchaseContact}
            disabled={!tokens || listing.status !== 'active'}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !tokens || listing.status !== 'active'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            解锁微信
          </button>
        </div>
      </div>
    </div>
  );
}