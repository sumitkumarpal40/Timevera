import re
with open('src/components/Categories.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"const Categories: React.FC<CategoriesProps> = \(\{ activeCategory, onCategoryChange \}\) => \{",
    "const Categories: React.FC<CategoriesProps> = ({ activeCategory, onCategoryChange }) => {", content)

# The issue is activeCategory is being passed as string, but maybe CategoriesProps expects specific strings.
# I'll just change CategoriesProps to activeCategory: string in Categories.tsx
content = re.sub(r'activeCategory: .*?;', 'activeCategory: string;', content)

with open('src/components/Categories.tsx', 'w') as f:
    f.write(content)
