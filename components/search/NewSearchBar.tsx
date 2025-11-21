import React, { useState, useCallback, useRef } from 'react';

interface SearchBarProps {
  onSearch?: (keyword: string, filters: SearchFilters) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface SearchFilters {
  tradeTypes?: string[];
  priceRange?: [number, number];
  sortBy?: 'time' | 'price_low' | 'price_high';
}

const TRADE_OPTIONS = [
  { value: 'sell', label: '出售', color: 'bg-green-100 text-green-800' },
  { value: 'buy', label: '求购', color: 'bg-blue-100 text-blue-800' },
  { value: 'exchange', label: '交换', color: 'bg-purple-100 text-purple-800' },
  { value: 'service', label: '服务', color: 'bg-orange-100 text-orange-800' },
];

const PRICE_RANGES = [
  { value: [0, 100], label: '100元以下' },
  { value: [100, 500], label: '100-500元' },
  { value: [500, 1000], label: '500-1000元' },
  { value: [1000, 5000], label: '1000-5000元' },
  { value: [5000, 999999], label: '5000元以上' },
];

const SORT_OPTIONS = [
  { value: 'time', label: '最新发布' },
  { value: 'price_low', label: '价格从低到高' },
  { value: 'price_high', label: '价格从高到低' },
];

export function NewSearchBar({
  onSearch,
  placeholder = "搜索关键词、商品、服务...",
  autoFocus = false
}: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    tradeTypes: [],
    priceRange: [0, 999999],
    sortBy: 'time',
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(() => {
    if (keyword.trim()) {
      onSearch?.(keyword.trim(), filters);
    }
  }, [keyword, filters, onSearch]);

  const toggleTradeType = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      tradeTypes: prev.tradeTypes?.includes(value)
        ? prev.tradeTypes.filter(t => t !== value)
        : [...(prev.tradeTypes || []), value]
    }));
  }, []);

  const handleQuickKeyword = useCallback((quickKeyword: string) => {
    setKeyword(quickKeyword);
    setShowFilters(false);
    if (quickKeyword.trim()) {
      onSearch?.(quickKeyword.trim(), filters);
    }
  }, [filters, onSearch]);

  // 模拟热门关键词数据
  const hotKeywords = [
    '二手手机', '电脑配件', '游戏账号', '房屋租赁',
    '兼职招聘', '闲置物品', '技能服务', '游戏装备'
  ];

  return (
    <div className="sticky top-14 z-40 bg-gray-50 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* 搜索栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="w-full px-4 py-2 pr-24 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              搜索
            </button>
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || (filters.tradeTypes?.length && filters.tradeTypes.length > 0)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            筛选
            {(filters.tradeTypes?.length && filters.tradeTypes.length > 0) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">
                {filters.tradeTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 交易类型 */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">交易方式</div>
                <div className="flex flex-wrap gap-2">
                  {TRADE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleTradeType(option.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${option.color} ${
                        filters.tradeTypes?.includes(option.value)
                          ? 'ring-2 ring-offset-2 ring-blue-500'
                          : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 价格范围 */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">价格范围</div>
                <select
                  value={`${filters.priceRange?.[0] || 0}-${filters.priceRange?.[1] || 999999}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-').map(Number);
                    setFilters(prev => ({
                      ...prev,
                      priceRange: [min, max] as [number, number]
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={`${range.value[0]}-${range.value[1]}`} value={`${range.value[0]}-${range.value[1]}`}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序方式 */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">排序方式</div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as 'time' | 'price_low' | 'price_high'
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 重置按钮 */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setFilters({
                    tradeTypes: [],
                    priceRange: [0, 999999],
                    sortBy: 'time',
                  });
                  setShowFilters(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                重置
              </button>
            </div>
          </div>
        )}

        {/* 热门关键词 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-900 mb-2">热门搜索</div>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map((keyword, index) => (
              <button
                key={index}
                onClick={() => handleQuickKeyword(keyword)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}