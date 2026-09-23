import React from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Star,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CategoryItem } from '../types';

export interface FilterState {
  category: string;
  subcategory?: string;
  minRating: number; // 0, 4.0, 4.5, 4.8
  movement: string; // 'all' or specific
  strapMaterial: string; // 'all' or specific
  waterResistantOnly: boolean;
  inStockOnly: boolean;
  minDiscount: number; // 0, 20, 30, 50
  attributes?: Record<string, string>;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  category: 'all',
  subcategory: 'all',
  minRating: 0,
  movement: 'all',
  strapMaterial: 'all',
  waterResistantOnly: false,
  inStockOnly: false,
  minDiscount: 0,
  attributes: {},
};

interface ProductFilterDrawerProps {
  categories: CategoryItem[];
  availableAttributes: Record<string, string[]>;
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalMatchingCount: number;
  availableMovements?: string[];
  availableStraps?: string[];
}

export const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({
  categories = [],
  availableAttributes = {},
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalMatchingCount,
  availableMovements = ['Quartz', 'Automatic', 'Digital', 'Chronograph'],
  availableStraps = ['Stainless Steel', 'High-Density Vegan Leather', 'Silicone', 'Mesh Link'],
}) => {
  if (!isOpen) return null;

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.subcategory && filters.subcategory !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.movement !== 'all') count++;
    if (filters.strapMaterial !== 'all') count++;
    if (filters.waterResistantOnly) count++;
    if (filters.inStockOnly) count++;
    if (filters.minDiscount > 0) count++;
    if (filters.attributes) {
      count += Object.values(filters.attributes).filter(v => v !== 'all').length;
    }
    return count;
  };

  const activeCount = getActiveFilterCount();
  const isWatchCategory = ['all', 'budget', 'style', 'premium', 'gift'].includes(filters.category);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#121212] border-l border-zinc-200 dark:border-[#2e2e2e] h-full flex flex-col justify-between shadow-2xl text-zinc-900 dark:text-white">
        {/* Drawer Header */}
        <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-[#242424] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-red-600/10 text-red-600 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-brand text-sm sm:text-base font-bold">Filters</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                {activeCount > 0 ? `${activeCount} active filters applied` : 'Refine collection by specs'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeCount > 0 && (
              <button
                onClick={onResetFilters}
                className="text-[11px] sm:text-xs text-red-600 hover:text-red-700 font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              >
                Reset All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5 text-xs sm:text-sm">
          {/* 1. CATEGORY */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Collection / Category
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                onClick={() => onFilterChange({ category: 'all', subcategory: 'all', attributes: {} })}
                className={`p-2 sm:p-2.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                  filters.category === 'all'
                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                    : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ category: cat.id, subcategory: 'all', attributes: {} })}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                    filters.category === cat.id
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                      : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* SUBCATEGORY (Dynamic) */}
          {(() => {
            const selectedCatData = categories.find((c) => c.id === filters.category);
            if (selectedCatData?.subcategories && selectedCatData.subcategories.length > 0) {
              return (
                <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Subcategory
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <button
                      onClick={() => onFilterChange({ subcategory: 'all' })}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !filters.subcategory || filters.subcategory === 'all'
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      All
                    </button>
                    {selectedCatData.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onFilterChange({ subcategory: sub.id })}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          filters.subcategory === sub.id
                            ? 'bg-red-600 text-white border-red-600 shadow'
                            : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                        }`}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* MOVEMENT TYPE (Watch Only) */}
          {isWatchCategory && (
            <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Movement Type
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['all', ...availableMovements].map((m) => (
                  <button
                    key={m}
                    onClick={() => onFilterChange({ movement: m })}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      filters.movement === m
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {m === 'all' ? 'All Movements' : m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. STRAP MATERIAL (Watch Only) */}
          {isWatchCategory && (
            <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Strap Material
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['all', ...availableStraps].map((s) => (
                  <button
                    key={s}
                    onClick={() => onFilterChange({ strapMaterial: s })}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      filters.strapMaterial === s
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {s === 'all' ? 'All Straps' : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC ATTRIBUTES */}
          {Object.entries(availableAttributes || {}).map(([attrKey, values]) => {
            const attrValues = values as string[];
            if (!attrValues || attrValues.length === 0) return null;
            return (
              <div key={attrKey} className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {attrKey}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['all', ...attrValues].map((val) => {
                    const isSelected = val === 'all' 
                      ? (!filters.attributes?.[attrKey] || filters.attributes[attrKey] === 'all')
                      : filters.attributes?.[attrKey] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          const newAttributes = { ...(filters.attributes || {}) };
                          if (val === 'all') {
                            delete newAttributes[attrKey];
                          } else {
                            newAttributes[attrKey] = val;
                          }
                          onFilterChange({ attributes: newAttributes });
                        }}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow'
                            : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                        }`}
                      >
                        {val === 'all' ? `All ${attrKey}s` : val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* 5. CUSTOMER RATING */}
          <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Customer Rating
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { val: 0, label: 'All' },
                { val: 4.0, label: '4.0★+' },
                { val: 4.5, label: '4.5★+' },
                { val: 4.8, label: '4.8★+' },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => onFilterChange({ minRating: r.val })}
                  className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[10px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    filters.minRating === r.val
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {r.val > 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. MINIMUM DISCOUNT */}
          <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Discount
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { val: 0, label: 'All' },
                { val: 20, label: '20%+' },
                { val: 30, label: '30%+' },
                { val: 50, label: '50%+' },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => onFilterChange({ minDiscount: d.val })}
                  className={`py-1.5 sm:py-2 text-center rounded-lg text-[10px] sm:text-xs font-bold border transition-all cursor-pointer ${
                    filters.minDiscount === d.val
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. TOGGLES: IN STOCK & WATER RESISTANT */}
          <div className="space-y-2.5 pt-2.5 sm:pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50 dark:bg-[#181818] rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
              <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                In Stock Only (तुरंत उपलब्ध)
              </span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 rounded cursor-pointer accent-red-600"
              />
            </label>

            {isWatchCategory && (
              <label className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50 dark:bg-[#181818] rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Water Resistant (3 ATM / 5 ATM)
                </span>
                <input
                  type="checkbox"
                  checked={filters.waterResistantOnly}
                  onChange={(e) => onFilterChange({ waterResistantOnly: e.target.checked })}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 rounded cursor-pointer accent-red-600"
                />
              </label>
            )}
          </div>
        </div>

        {/* Drawer Bottom Action */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#161616] border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={onResetFilters}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Clear
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Show {totalMatchingCount} {totalMatchingCount === 1 ? 'Watch' : 'Watches'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
