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