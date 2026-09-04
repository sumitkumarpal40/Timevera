const fs = require('fs');
let content = fs.readFileSync('src/components/Categories.tsx', 'utf8');

content = content.replace("import { CATEGORIES_DATA } from '../data/watches';", "import { CategoryItem } from '../types';");

content = content.replace(
`interface CategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}`,
`interface CategoriesProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}`);

content = content.replace(
`export const Categories: React.FC<CategoriesProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {`,
`export const Categories: React.FC<CategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {`);

content = content.replace(
`{CATEGORIES_DATA.map((cat) => {`,
`{categories.map((cat) => {`);

fs.writeFileSync('src/components/Categories.tsx', content);
