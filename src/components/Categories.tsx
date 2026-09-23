import React from 'react';
import { CategoryItem } from '../types';
import { Sparkles, Watch, Crown, Gift, ArrowRight } from 'lucide-react';

interface CategoriesProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const Categories: React.FC<CategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#D4AF37]" />;
      case 'Watch':
        return <Watch className="w-5 h-5 text-[#D4AF37]" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-[#D4AF37]" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-[#D4AF37]" />;
      default:
        return <Watch className="w-5 h-5 text-[#D4AF37]" />;
    }
  };

  const handleCategoryClick = (id: string) => {
    onSelectCategory(id);
    const shopEl = document.getElementById('shop');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-left md:text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <span className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
          Curated Portfolios
        </span>
        <h2 className="font-brand text-xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-[#F8FAFC] mt-1 mb-2">
          Distinctive Collections
        </h2>
        <p className="text-[#A7AFBF] text-xs sm:text-sm md:text-base">
          Exceptional timepieces engineered for every personal style, budget, and milestone.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`group relative p-4 sm:p-5 bg-[#131620] border transition-all duration-300 cursor-pointer flex flex-col justify-between rounded-xl hover:shadow-xl ${
                isSelected
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/10'
                  : 'border-[#252A36] hover:border-[#D4AF37]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 sm:p-2.5 bg-[#0B0C10] border border-[#252A36] rounded-lg group-hover:border-[#D4AF37]/40 transition-colors">
                    {getIcon(cat.iconName)}
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#E5C07B] px-1.5 py-0.5 sm:px-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">
                    {cat.priceRange}
                  </span>
                </div>

                <h3 className="font-brand text-sm sm:text-base font-bold text-[#F8FAFC] mb-1.5 group-hover:text-[#E5C07B] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-[#A7AFBF] leading-relaxed mb-3 line-clamp-2 sm:line-clamp-none">
                  {cat.description}
                </p>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                    {cat.subcategories.map(sub => (
                      <span key={sub.id} className="text-[9px] sm:text-[10px] bg-[#1A1E2B] text-[#A7AFBF] px-1.5 py-0.5 sm:px-2 rounded border border-[#252A36] truncate max-w-full">
                        {sub.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#252A36] flex items-center justify-between text-[10px] sm:text-xs font-semibold text-[#E5C07B]">
                <span>Browse Portfolio</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
