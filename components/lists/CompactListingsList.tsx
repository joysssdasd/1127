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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="h-4 bg-gray-200 animate-pulse"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-2">📦</div>
        <p className="text-gray-500 text-lg">暂无相关信息</p>
        <p className="text-gray-400 text-sm mt-2">试试换个关键词或发布新信息</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {listings.map((listing) => (
        <NewInfoCard key={listing.id} listing={listing} compact={true} />
      ))}
    </div>
  );
}