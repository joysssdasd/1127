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
  const [error, setError] = useState<string | null>(null);
  const [databaseWarning, setDatabaseWarning] = useState<string | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    tradeTypes: [],
    priceRange: [0, 999999],
    sortBy: 'time',
  });

  // 加载交易信息列表
  const loadListings = useCallback(async (keyword?: string, filters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    setDatabaseWarning(null);

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
        if (res.status === 503 || res.status === 502) {
          setError('数据库服务暂时不可用');
          setListings([]);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // 检查是否有数据库警告
      if (data.warning) {
        setDatabaseWarning(data.warning);
        show('数据库连接失败，显示演示数据');
      }

      setListings(data.data ?? []);
    } catch (error) {
      console.warn('Failed to load listings:', error);
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('503') || errorMessage.includes('502')) {
        setError('数据库服务暂时不可用，请稍后重试');
      } else if (errorMessage.includes('Failed to fetch')) {
        setError('无法连接到服务器，请检查网络连接');
      } else {
        setError('加载数据时发生错误');
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
      <CompactListingsList
        listings={listings}
        loading={loading}
        error={error}
        databaseWarning={databaseWarning}
      />

      {/* Toast 提示组件 */}
      <Toast message={message} />
    </NewMainLayout>
  );
}
