import { useCallback, useEffect, useState } from 'react';
import type { ListingPayload } from '../backend/shared/contracts/listing';
import { NewMainLayout } from '../components/layout/MainLayout';
import { NewSearchBar, type SearchFilters } from '../components/search/NewSearchBar';
import { CompactListingsList } from '../components/lists/CompactListingsList';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';

export default function HomePage() {
  const { tokens } = useAuth();
  const { message, show } = useToast();
  const [listings, setListings] = useState<ListingPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    tradeTypes: [],
    priceRange: [0, 999999],
    sortBy: 'time',
  });

  // 加载交易信息列表
  const loadListings = useCallback(async (keyword?: string, filters?: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // 添加关键词参数
      if (keyword) {
        params.append('keyword', keyword);
      }

      // 添加筛选参数
      if (filters?.tradeTypes && filters.tradeTypes.length > 0) {
        params.append('tradeTypes', filters.tradeTypes.join(','));
      }

      if (filters?.priceRange) {
        params.append('minPrice', filters.priceRange[0].toString());
        params.append('maxPrice', filters.priceRange[1].toString());
      }

      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }

      const query = params.toString();
      const res = await fetch(`/api/listings${query ? `?${query}` : ''}`);

      if (!res.ok) {
        if (res.status === 503) {
          show('数据库服务暂时不可用，显示演示数据');
          setListings([]);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setListings(data.data ?? []);
    } catch (error) {
      console.warn('Failed to load listings:', error);
      if ((error as Error).message?.includes('503')) {
        show('数据库服务暂时不可用，显示演示数据');
      }
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [show]);

  // 处理搜索请求
  const handleSearch = useCallback((keyword: string, filters: SearchFilters) => {
    setCurrentKeyword(keyword);
    setCurrentFilters(filters);
    loadListings(keyword, filters);
  }, [loadListings]);

  // 初始加载数据
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <NewMainLayout>
      {/* 搜索栏组件 */}
      <NewSearchBar
        onSearch={handleSearch}
        placeholder="搜索关键词、商品、服务..."
        autoFocus={false}
      />

      {/* 交易信息列表 */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <CompactListingsList
          listings={listings}
          loading={loading}
        />
      </div>

      {/* Toast 提示组件 */}
      <Toast message={message} />
    </NewMainLayout>
  );
}
