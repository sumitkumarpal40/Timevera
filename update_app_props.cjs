const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`      <Categories
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />`,
`      <Categories
        categories={dynamicCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />`);

content = content.replace(
`      <ProductFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filterState}`,
`      <ProductFilterDrawer
        categories={dynamicCategories}
        availableAttributes={availableAttributes}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filterState}`);

fs.writeFileSync('src/App.tsx', content);
