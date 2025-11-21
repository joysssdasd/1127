import React from 'react';
import { NewInfoCard } from '../cards/NewInfoCard';
import type { ListingPayload } from '../../backend/shared/contracts/listing';

interface CompactListingsListProps {
  listings: ListingPayload[];
  loading?: boolean;
}

export function CompactListingsList({ listings, loading = false }: CompactListingsListProps) {
  if (loading) {
    return (
      <div className="min-h-[400px] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-purple-100 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">暂无相关信息</h3>
          <p className="text-gray-600 mb-4">试试换个关键词或筛选条件</p>
          <div className="flex justify-center space-x-3">
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
              💡 调整搜索
            </div>
            <div className="px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium">
              📝 发布信息
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] p-6 bg-gradient-to-b from-purple-50/30 via-white to-pink-50/30">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <NewInfoCard key={listing.id} listing={listing} compact={false} />
        ))}
      </div>
    </div>
  );
}