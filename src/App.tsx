import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Categories } from './components/Categories';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { ReviewsSection } from './components/ReviewsSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { InstallAppModal } from './components/InstallAppModal';
import { PaymentModal } from './components/PaymentModal';
import { OrderTrackModal } from './components/OrderTrackModal';
import { ProductFilterDrawer, FilterState, DEFAULT_FILTER_STATE } from './components/ProductFilterDrawer';
import { LegalPagesModal } from './components/LegalPagesModal';
import { ThemeProvider } from './context/ThemeContext';
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext';
import { CustomerLoginModal } from './components/CustomerLoginModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { useModalBackButton } from './hooks/useModalBackButton';

import { WatchProduct, CartItem, Coupon } from './types';
import { subscribeToProducts, getProductById } from './lib/productInventoryService';
import { db } from './lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SlidersHorizontal, ShieldCheck, Filter, Sparkles } from 'lucide-react';

function TimeveraStore() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    isAccountModalOpen,
    closeAccountModal,
    openAccountModal,
  } = useCustomerAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<WatchProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isOrderTrackOpen, setIsOrderTrackOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState<string>('');
  const [paymentSingleProduct, setPaymentSingleProduct] = useState<WatchProduct | null>(null);
  const [paymentSingleQuantity, setPaymentSingleQuantity] = useState<number>(1);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Advanced Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Legal / Policies Modal State
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'shipping' | 'refund' | 'cancellation' | 'contact'>('privacy');

  // Back button handling for all local modals/drawers
  useModalBackButton(isCartOpen, () => setIsCartOpen(false));
  useModalBackButton(isPaymentOpen, () => {
    setIsPaymentOpen(false);
    setPaymentSingleProduct(null);
    setPaymentSingleQuantity(1);
  });
  useModalBackButton(isOrderTrackOpen, () => {
    setIsOrderTrackOpen(false);
    setTrackOrderId('');
  });
  useModalBackButton(isFilterDrawerOpen, () => setIsFilterDrawerOpen(false));
  useModalBackButton(isLegalModalOpen, () => setIsLegalModalOpen(false));
  useModalBackButton(isInstallAppOpen, () => setIsInstallAppOpen(false));
  useModalBackButton(quickViewProduct !== null, () => setQuickViewProduct(null));

  const handleOpenLegal = (tab?: 'privacy' | 'terms' | 'shipping' | 'refund' | 'cancellation' | 'contact') => {
    if (tab) setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Check URL hash for tracking links (e.g. #track or #orders) -> Redirect to Customer Account
  useEffect(() => {
    const handleCheckHash = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      if (hash.startsWith('#p/')) {
        const shortCode = decodeURIComponent(hash.substring(3)).trim();
        if (shortCode) {
          try {
            // First check if it's a direct ID (for backwards compatibility with existing links)
            const directProduct = await getProductById(shortCode);
            if (directProduct) {
              setQuickViewProduct(directProduct);
              return;
            }

            // Otherwise query by shortCode
            const q = query(
              collection(db, 'products'),
              where('shortCode', '==', shortCode),
              limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const docSnap = snapshot.docs[0];
              const data = docSnap.data() as any;
              const mrp = Number(data.price) || 0;
              const sellingPrice = Number(data.discountPrice) > 0 ? Number(data.discountPrice) : mrp;
              
              setQuickViewProduct({ 
                id: docSnap.id, 
                ...data,
                price: sellingPrice,
                originalPrice: mrp,
              } as WatchProduct);
            }
          } catch (err) {
            console.error('Error handling shortCode deep link:', err);
          }
        }
      } else if (hash.startsWith('#track') || hash === '#my-orders') {
        openAccountModal('orders');
      } else if (hash === '#wishlist') {
        openAccountModal('wishlist');
      } else if (hash === '#privacy') {
        handleOpenLegal('privacy');
      } else if (hash === '#terms') {
        handleOpenLegal('terms');
      } else if (hash === '#shipping') {
        handleOpenLegal('shipping');
      } else if (hash === '#refund') {
        handleOpenLegal('refund');
      } else if (hash === '#cancellation') {
        handleOpenLegal('cancellation');
      }
    };
    handleCheckHash();
    window.addEventListener('hashchange', handleCheckHash);
    return () => window.removeEventListener('hashchange', handleCheckHash);
  }, [openAccountModal]);

  // Real-time products strictly from Firestore (Time Vera Store database)
  const [products, setProducts] = useState<WatchProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  useEffect(() => {
    // Clear any obsolete product cache keys from localStorage on mount
    try {
      localStorage.removeItem('timevera_cached_products');
      localStorage.removeItem('products');
      localStorage.removeItem('timevera_products');
      localStorage.removeItem('cached_products');
      localStorage.removeItem('stored_products');
    } catch {}

    let isMounted = true;
    const unsubscribe = subscribeToProducts(
      (liveProducts) => {
        if (!isMounted) return;
        setProducts(liveProducts || []);
        setIsProductsLoading(false);
      },
      (error) => {
        console.error('Firestore products live listener error:', error);
        if (isMounted) {
          setProducts([]);
          setIsProductsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('timevera_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('timevera_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Add / update in cart with custom quantity
  const handleAddToCart = (product: WatchProduct, quantity: number = 1) => {
    const addQty = Math.max(1, quantity || 1);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      }
      return [...prev, { product, quantity: addQty }];
    });
  };

  const handleBuyNow = (product: WatchProduct, quantity: number = 1) => {
    setPaymentSingleProduct(product);
    setPaymentSingleQuantity(Math.max(1, quantity || 1));
    setIsPaymentOpen(true);
  };

  const handleOpenCartCheckout = () => {
    setPaymentSingleProduct(null);
    setPaymentSingleQuantity(1);
    setIsPaymentOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Sync category pills with filterState
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setFilterState((prev) => ({ ...prev, category: cat }));
  };


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

  // Count active filter criteria
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.category !== 'all') count++;
    if (filterState.subcategory && filterState.subcategory !== 'all') count++;
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
  }, [filterState]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      const effectiveCategory = filterState.category !== 'all' ? filterState.category : selectedCategory;
      const matchesCategory =
        effectiveCategory === 'all' || 
        (product.category || '').toLowerCase() === (effectiveCategory || '').toLowerCase();

      // Subcategory match
      const matchesSubcategory = 
        !filterState.subcategory || 
        filterState.subcategory === 'all' || 
        (product.subcategory || '').toLowerCase() === (filterState.subcategory || '').toLowerCase();

      // Movement — top-level या attributes से (case-insensitive key)
      const movementValue = product.movement 
        || product.attributes?.movement 
        || product.attributes?.['Movement'] 
        || '';
      const matchesMovement = filterState.movement === 'all' 
        || !movementValue
        || movementValue.toLowerCase().includes(filterState.movement.toLowerCase());

      // Strap — top-level या attributes से
      const strapValue = product.strapMaterial 
        || product.strap 
        || product.attributes?.strap 
        || product.attributes?.['Strap'] 
        || product.attributes?.['Strap Type'] 
        || '';
      const matchesStrap = filterState.strapMaterial === 'all' 
        || !strapValue
        || strapValue.toLowerCase().includes(filterState.strapMaterial.toLowerCase());

      // Rating (safe numeric fallback so missing/undefined rating is not rejected)
      const productRating = Number(product.rating) || 0;
      const minRating = Number(filterState.minRating) || 0;
      const matchesRating = minRating === 0 || productRating >= minRating;

      // Stock
      const productStock = Number(product.stock) || 0;
      const matchesStock = !filterState.inStockOnly || productStock > 0;

      // Water resistance — top-level या attributes से
      const waterValue = product.waterResistance 
        || product.attributes?.waterResistance 
        || product.attributes?.['Water Resistance'] 
        || '';
      const matchesWater = !filterState.waterResistantOnly 
        || !waterValue
        || (waterValue !== 'No' && waterValue !== 'None');

      // Discount
      const productPrice = Number(product.price) || 0;
      const productOriginalPrice = Number(product.originalPrice) || 0;
      const discountPercent = productOriginalPrice > productPrice 
        ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
        : 0;
      const matchesDiscount = discountPercent >= (filterState.minDiscount || 0);
      
      // Dynamic Attributes
      const matchesAttributes = !filterState.attributes || Object.entries(filterState.attributes).every(([key, val]) => {
        if (!val || val === 'all') return true;
        return product.attributes && product.attributes[key] === val;
      });

      // Search match
      const search = searchTerm.toLowerCase();
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productMovement = (product.movement || '').toLowerCase();
      const productStrap = (product.strapMaterial || '').toLowerCase();
      const productCategoryLabel = (product.categoryLabel || '').toLowerCase();
      const matchesSearch =
        searchTerm.trim() === '' ||
        productName.includes(search) ||
        productDesc.includes(search) ||
        productMovement.includes(search) ||
        productStrap.includes(search) ||
        productCategoryLabel.includes(search);

      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesMovement &&
        matchesStrap &&
        matchesRating &&
        matchesStock &&
        matchesWater &&
        matchesDiscount &&
        matchesAttributes &&
        matchesSearch
      );
    }).sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return ratingB - ratingA;
      return 0; // default featured order
    });
  }, [products, selectedCategory, filterState, searchTerm, sortBy]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isProductInCart = (productId: string) => {
    return cartItems.some((item) => item.product.id === productId);
  };

  const scrollToShop = () => {
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0b0b0b] text-zinc-900 dark:text-white flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* NAVBAR */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectCategory={handleSelectCategory}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        onOpenWishlist={() => openAccountModal('wishlist')}
      />

      {/* HERO SECTION */}
      <Hero onShopClick={scrollToShop} />

      {/* CATEGORIES SECTION */}
      <Categories
        categories={dynamicCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* PRODUCTS / SHOP SECTION */}
      <section id="shop" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-zinc-200 dark:border-[#222]">
          <div>
            <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              Featured Watches
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              Direct store delivery • Free Express Home Delivery & Cash on Delivery (COD)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 border border-emerald-200 dark:border-emerald-900 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Direct Store Orders Active</span>
          </div>
        </div>

        {/* Filter Controls & Category Tabs */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Products' },
              ...dynamicCategories.map((c) => ({ id: c.id, label: c.title })),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectCategory(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  (filterState.category === tab.id || (filterState.category === 'all' && selectedCategory === tab.id))
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-white dark:bg-[#161616] text-zinc-700 dark:text-zinc-300 hover:text-red-600 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar & Filter & Sorting */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                  : 'bg-white dark:bg-[#141414] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-red-500'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[10px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-zinc-900 dark:text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="featured">Featured / New</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Bar (if any applied) */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-2.5 rounded-xl">
            <span className="font-bold text-red-700 dark:text-red-300">Active Filters:</span>
            {filterState.movement !== 'all' && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                Movement: {filterState.movement}
              </span>
            )}
            {filterState.strapMaterial !== 'all' && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                Strap: {filterState.strapMaterial}
              </span>
            )}
            {filterState.minRating > 0 && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold">
                ★ {filterState.minRating}+
              </span>
            )}
            {filterState.waterResistantOnly && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold">
                Water Resistant
              </span>
            )}
            {filterState.inStockOnly && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold">
                In Stock Only
              </span>
            )}
                        {filterState.minDiscount > 0 && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold">
                Min {filterState.minDiscount}% Off
              </span>
            )}
            {filterState.subcategory && filterState.subcategory !== 'all' && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                {filterState.subcategory}
              </span>
            )}
            {filterState.attributes && Object.entries(filterState.attributes).map(([k, v]) => (
              v && v !== 'all' && (
                <span key={k} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                  {k}: {v}
                </span>
              )
            ))}
            <button
              onClick={() => {
                setFilterState(DEFAULT_FILTER_STATE);
                setSelectedCategory('all');
              }}
              className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400 font-bold underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 animate-pulse space-y-3"
              >
                <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 p-8 space-y-4 rounded-2xl max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-amber-500/10 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-brand text-2xl font-bold text-zinc-900 dark:text-white">
              {products.length === 0 ? "No Products Available Right Now" : "No Products Found"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {products.length === 0
                ? "Our catalog is currently being updated with fresh inventory from the store. Please check back shortly or explore our customer support."
                : "We couldn't find any products matching your current search and filter selections."}
            </p>
            {products.length > 0 && (
              <div className="pt-3">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setFilterState(DEFAULT_FILTER_STATE);
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-md shadow-red-600/20"
                >
                  Reset & View All Products
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                isInCart={isProductInCart(product.id)}
                cartQuantity={cartItems.find((i) => i.product.id === product.id)?.quantity || 0}
                onUpdateCartQuantity={handleUpdateQuantity}
                onOpenCart={() => setIsCartOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* REVIEWS SECTION */}
      <ReviewsSection />

      {/* ABOUT SECTION */}
      <AboutSection />

      {/* FAQ SECTION */}
      <FAQSection />

      {/* CONTACT & DIRECT HELPLINE */}
      <ContactSection />

      {/* FOOTER */}
      <Footer
        onOpenAdmin={() => {}}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        onOpenLegal={handleOpenLegal}
      />

      {/* PRODUCT ADVANCED FILTER DRAWER */}
      <ProductFilterDrawer
        categories={dynamicCategories}
        availableAttributes={availableAttributes}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filterState}
        onFilterChange={(updated) => {
          setFilterState((prev) => {
            const next = { ...prev, ...updated };
            if (updated.category && updated.category !== 'all') {
              setSelectedCategory(updated.category);
            }
            return next;
          });
        }}
        onResetFilters={() => {
          setFilterState(DEFAULT_FILTER_STATE);
          setSelectedCategory('all');
        }}
        totalMatchingCount={filteredProducts.length}
      />

      {/* LEGAL & POLICY PAGES MODAL */}
      <LegalPagesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* QUICK VIEW MODAL */}
      <ProductModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isInCart={quickViewProduct ? isProductInCart(quickViewProduct.id) : false}
        cartQuantity={quickViewProduct ? cartItems.find((i) => i.product.id === quickViewProduct.id)?.quantity || 0 : 0}
        onOpenCart={() => {
          setQuickViewProduct(null);
          setIsCartOpen(true);
        }}
      />

      {/* CHECKOUT MODAL (PURE COD & DIRECT STORE ORDER - 4 STEPS) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentSingleProduct(null);
          setPaymentSingleQuantity(1);
        }}
        singleProduct={paymentSingleProduct}
        initialQuantity={paymentSingleQuantity}
        cartItems={cartItems}
        initialCoupon={appliedCoupon}
        onOrderSuccess={() => {
          handleClearCart();
          setAppliedCoupon(null);
        }}
        onUpdateCartQuantity={handleUpdateQuantity}
        onOpenTrackOrder={() => {
          openAccountModal('orders');
        }}
      />

      {/* CUSTOMER ORDER TRACKING MODAL */}
      <OrderTrackModal
        isOpen={isOrderTrackOpen}
        onClose={() => {
          setIsOrderTrackOpen(false);
          setTrackOrderId('');
        }}
        initialOrderId={trackOrderId}
      />

      {/* INSTALL APP MODAL */}
      <InstallAppModal
        isOpen={isInstallAppOpen}
        onClose={() => setIsInstallAppOpen(false)}
      />

      {/* CART / MULTI-ORDER DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOpenCheckout={handleOpenCartCheckout}
        onCouponChange={setAppliedCoupon}
      />

      {/* ⭐ CUSTOMER OTP LOGIN / SIGNUP MODAL ⭐ */}
      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />

      {/* ⭐ CUSTOMER ACCOUNT & LIVE ORDERS DASHBOARD MODAL ⭐ */}
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={closeAccountModal}
        products={products}
        onReorderProduct={(prod) => {
          setPaymentSingleProduct(prod);
          setPaymentSingleQuantity(1);
          setIsPaymentOpen(true);
        }}
        onOpenTrackOrder={(ordId) => {
          setTrackOrderId(ordId);
          setIsOrderTrackOpen(true);
        }}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <TimeveraStore />
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
