const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Update activeFilterCount
content = content.replace(
  /const activeFilterCount = useMemo\(\(\) => \{[\s\S]*?\}, \[filterState\]\);/,
  `const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.category !== 'all') count++;
    if (filterState.subcategory && filterState.subcategory !== 'all') count++;
    if (filterState.minPrice > 100 || filterState.maxPrice < 5000) count++;
    if (filterState.movement !== 'all') count++;
    if (filterState.strapMaterial !== 'all') count++;
    if (filterState.minRating > 0) count++;
    if (filterState.inStockOnly) count++;
    if (filterState.waterResistantOnly) count++;
    if (filterState.minDiscount > 0) count++;
    if (filterState.attributes) {
      count += Object.values(filterState.attributes).filter(v => v !== 'all').length;
    }
    return count;
  }, [filterState]);`
);

// Update filteredProducts
const replacement = `const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      const effectiveCategory = filterState.category !== 'all' ? filterState.category : selectedCategory;
      const matchesCategory =
        effectiveCategory === 'all' || product.category === effectiveCategory;

      // Subcategory match
      const matchesSubcategory = 
        !filterState.subcategory || filterState.subcategory === 'all' || product.subcategory === filterState.subcategory;

      // Price range
      const matchesPrice =
        product.price >= filterState.minPrice &&
        product.price <= filterState.maxPrice;

      // Movement
      const matchesMovement =
        filterState.movement === 'all' ||
        (product.movement && product.movement.toLowerCase() === filterState.movement.toLowerCase());

      // Strap Material
      const matchesStrap =
        filterState.strapMaterial === 'all' ||
        (product.strapMaterial && product.strapMaterial.toLowerCase().includes(filterState.strapMaterial.toLowerCase()));

      // Rating
      const matchesRating = product.rating >= filterState.minRating;

      // Stock
      const matchesStock = !filterState.inStockOnly || product.stock > 0;

      // Water resistance
      const matchesWater = !filterState.waterResistantOnly || (product.waterResistance && product.waterResistance !== 'No' && product.waterResistance !== 'None');

      // Discount
      const discountPercent = product.originalPrice && product.originalPrice > product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
      const matchesDiscount = discountPercent >= filterState.minDiscount;
      
      // Dynamic Attributes
      const matchesAttributes = !filterState.attributes || Object.entries(filterState.attributes).every(([key, val]) => {
        if (!val || val === 'all') return true;
        return product.attributes && product.attributes[key] === val;
      });

      // Search match
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm.trim() === '' ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        (product.movement && product.movement.toLowerCase().includes(search)) ||
        (product.strapMaterial && product.strapMaterial.toLowerCase().includes(search)) ||
        (product.categoryLabel && product.categoryLabel.toLowerCase().includes(search));

      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesPrice &&
        matchesMovement &&
        matchesStrap &&
        matchesRating &&
        matchesStock &&
        matchesWater &&
        matchesDiscount &&
        matchesAttributes &&
        matchesSearch
      );
    }).sort((a, b) => {`;

content = content.replace(
  /const filteredProducts = useMemo\(\(\) => \{[\s\S]*?\}\)\.sort\(\(a, b\) => \{/,
  replacement
);

fs.writeFileSync('src/App.tsx', content);
