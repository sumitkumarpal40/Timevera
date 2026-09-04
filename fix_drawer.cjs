const fs = require('fs');
let content = fs.readFileSync('src/components/ProductFilterDrawer.tsx', 'utf8');

content = content.replace("import { CATEGORIES_DATA } from '../data/watches';", "import { CategoryItem } from '../types';");

content = content.replace(
`interface ProductFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalMatchingCount: number;
  availableMovements?: string[];
  availableStraps?: string[];
}`,
`interface ProductFilterDrawerProps {
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
}`);

content = content.replace(
`export const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalMatchingCount,
  availableMovements = [],
  availableStraps = [],
}) => {`,
`export const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({
  categories,
  availableAttributes,
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalMatchingCount,
  availableMovements = [],
  availableStraps = [],
}) => {`);

content = content.replace(/{CATEGORIES_DATA\.map/g, '{categories.map');
content = content.replace(/CATEGORIES_DATA\.find/g, 'categories.find');

fs.writeFileSync('src/components/ProductFilterDrawer.tsx', content);
