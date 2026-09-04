const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const hooksCode = `
  // Dynamic Categories and Attributes Extraction
  const { dynamicCategories, availableAttributes } = useMemo(() => {
    const categoriesMap = new Map();
    const attrsMap = {};

    products.forEach((product) => {
      // Process Categories & Subcategories
      const catId = product.category || 'uncategorized';
      if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, {
          id: catId,
          title: product.categoryLabel || catId.charAt(0).toUpperCase() + catId.slice(1),
          priceRange: 'Explore Collection',
          description: 'Curated products for this category.',
          iconName: 'Sparkles', // Generic fallback
          accent: 'from-zinc-800/60 to-black',
          subcategories: new Map()
        });
      }
      const catEntry = categoriesMap.get(catId);
      if (product.subcategory) {
        catEntry.subcategories.set(product.subcategory, { 
          id: product.subcategory, 
          title: product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1) 
        });
      }
      
      // Process Attributes
      if (product.attributes) {
        Object.entries(product.attributes).forEach(([key, val]) => {
          if (!val) return;
          if (!attrsMap[key]) attrsMap[key] = new Set();
          attrsMap[key].add(val);
        });
      }
    });

    const parsedCategories = Array.from(categoriesMap.values()).map(cat => ({
      ...cat,
      subcategories: Array.from(cat.subcategories.values())
    }));
    
    // Sort categories (budget, style, premium, gift first for backwards compatibility)
    const legacyOrder = ['budget', 'style', 'premium', 'gift'];
    parsedCategories.sort((a, b) => {
      const idxA = legacyOrder.indexOf(a.id);
      const idxB = legacyOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });

    const parsedAttributes = {};
    for (const key in attrsMap) {
      parsedAttributes[key] = Array.from(attrsMap[key]).sort();
    }

    return { dynamicCategories: parsedCategories, availableAttributes: parsedAttributes };
  }, [products]);

  // Count active filter criteria`;

content = content.replace('  // Count active filter criteria', hooksCode);

fs.writeFileSync('src/App.tsx', content);
