import React from 'react';
import { NewInfoCard } from '../cards/NewInfoCard';
import type { ListingPayload } from '../../backend/shared/contracts/listing';

interface CompactListingsListProps {
  listings: ListingPayload[];
  loading?: boolean;
}

export function CompactListingsList({
  listings,
  loading = false,
  error = null,
  databaseWarning = null
}: CompactListingsListProps & { error?: string | null, databaseWarning?: string | null }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-32 bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">连接服务器失败</h3>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <div className="space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            重新加载
          </button>
          <button
            onClick={() => window.open('/api/debug/env-check', '_blank')}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            检查配置
          </button>
        </div>
      </div>
    );
  }

  if (databaseWarning) {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-yellow-400 text-xl mr-3">⚠️</div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">数据库连接警告</h4>
              <p className="text-sm text-yellow-600">{databaseWarning}</p>
              <p className="text-xs text-yellow-500 mt-1">当前显示演示数据</p>
            </div>
          </div>
        </div>
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关信息</h3>
            <p className="text-gray-500 text-sm">试试换个关键词或发布新信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {listings.map((listing) => (
              <NewInfoCard key={listing.id} listing={listing} compact={true} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关信息</h3>
        <p className="text-gray-500 text-sm">试试换个关键词或发布新信息</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {listings.map((listing) => (
        <NewInfoCard key={listing.id} listing={listing} compact={true} />
      ))}
    </div>
  );
}