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
    <div className="sticky top-16 z-40 bg-gradient-to-b from-white to-purple-50/30 border-b border-purple-100 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-xl"></div>
            <div className="relative flex items-center space-x-3">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={placeholder}
                  autoFocus={autoFocus}
                  className="w-full pl-12 pr-40 py-4 text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  🔍 搜索
                </button>
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`group px-6 py-4 text-sm font-medium rounded-2xl border-2 transition-all duration-200 ${
                  showFilters || (filters.tradeTypes?.length && filters.tradeTypes.length > 0)
                    ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-lg'
                    : 'border-purple-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                  <span>筛选</span>
                  {(filters.tradeTypes?.length && filters.tradeTypes.length > 0) && (
                    <div className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                      {filters.tradeTypes.length}
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="mb-6 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-purple-100 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 交易类型 */}
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>交易方式</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRADE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleTradeType(option.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${
                        filters.tradeTypes?.includes(option.value)
                          ? `${option.color} shadow-md ring-2 ring-offset-2 ring-purple-400`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 价格范围 */}
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>价格范围</span>
                </div>
                <select
                  value={`${filters.priceRange?.[0] || 0}-${filters.priceRange?.[1] || 999999}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-').map(Number);
                    setFilters(prev => ({
                      ...prev,
                      priceRange: [min, max] as [number, number]
                    }));
                  }}
                  className="w-full px-4 py-3 text-sm border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
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
                <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>排序方式</span>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as 'time' | 'price_low' | 'price_high'
                  }))}
                  className="w-full px-4 py-3 text-sm border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
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
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setFilters({
                    tradeTypes: [],
                    priceRange: [0, 999999],
                    sortBy: 'time',
                  });
                  setShowFilters(false);
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                🔄 重置筛选
              </button>
            </div>
          </div>
        )}

        {/* 热门关键词 */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span>🔥 热门搜索</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map((keyword, index) => (
              <button
                key={index}
                onClick={() => handleQuickKeyword(keyword)}
                className="group px-4 py-2 text-sm font-medium text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all duration-200 transform hover:scale-105"
              >
                <span className="group-hover:text-purple-800">{keyword}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}