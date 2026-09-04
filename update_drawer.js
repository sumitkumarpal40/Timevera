const fs = require('fs');

let content = fs.readFileSync('src/components/ProductFilterDrawer.tsx', 'utf8');

// 1. Update FilterState
content = content.replace(
  /export interface FilterState \{[\s\S]*?\}/,
  `export interface FilterState {
  category: string;
  subcategory?: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  movement: string; 
  strapMaterial: string; 
  waterResistantOnly: boolean;
  inStockOnly: boolean;
  minDiscount: number;
  attributes?: Record<string, string>;
}`
);

// 2. Update DEFAULT_FILTER_STATE
content = content.replace(
  /export const DEFAULT_FILTER_STATE: FilterState = \{[\s\S]*?\};/,
  `export const DEFAULT_FILTER_STATE: FilterState = {
  category: 'all',
  subcategory: 'all',
  minPrice: 100,
  maxPrice: 5000,
  minRating: 0,
  movement: 'all',
  strapMaterial: 'all',
  waterResistantOnly: false,
  inStockOnly: false,
  minDiscount: 0,
  attributes: {},
};`
);

// 3. Add import CATEGORIES_DATA
if (!content.includes('CATEGORIES_DATA')) {
  content = content.replace(
    /import \{[\s\S]*?\} from 'lucide-react';/,
    `$&
import { CATEGORIES_DATA } from '../data/watches';`
  );
}

// 4. Update getActiveFilterCount
content = content.replace(
  /const getActiveFilterCount = \(\) => \{[\s\S]*?return count;\n  \};/,
  `const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.subcategory && filters.subcategory !== 'all') count++;
    if (filters.minPrice > 100 || filters.maxPrice < 5000) count++;
    if (filters.minRating > 0) count++;
    if (filters.movement !== 'all') count++;
    if (filters.strapMaterial !== 'all') count++;
    if (filters.waterResistantOnly) count++;
    if (filters.inStockOnly) count++;
    if (filters.minDiscount > 0) count++;
    if (filters.attributes) {
      count += Object.values(filters.attributes).filter(v => v && v !== 'all').length;
    }
    return count;
  };`
);

fs.writeFileSync('src/components/ProductFilterDrawer.tsx', content);
