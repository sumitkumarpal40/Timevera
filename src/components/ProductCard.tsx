import React, { useState } from 'react';
import { Plus, Check, Star, ShoppingBag, Heart } from 'lucide-react';
import { StoreProduct } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface ProductCardProps {
  product: StoreProduct;
  onQuickView: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, quantity?: number) => void;
  onBuyNow: (product: StoreProduct, quantity?: number) => void;
  isInCart: boolean;
  cartQuantity?: number;
  onUpdateCartQuantity?: (productId: string, quantity: number) => void;
  onOpenCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  isInCart,
  cartQuantity = 0,
}) => {
  const { isInWishlist, toggleWishlist } = useCustomerAuth();
  const [justAdded, setJustAdded] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const mrp = Number(product.originalPrice || product.price || 0);
  const sellingPrice = Number(product.discountPrice) > 0
    ? Number(product.discountPrice)
    : Number(product.price) || 0;

  const discountPercent = (mrp > sellingPrice && mrp > 0)
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 active:scale-[0.98] transition-transform cursor-pointer relative flex flex-col justify-between shadow-sm hover:shadow-md"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discountPercent > 0 ? (
          <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
            {discountPercent}% OFF
          </span>
        ) : product.tag ? (
          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 uppercase">
            {product.tag}
          </span>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute top-1.5 right-1.5 p-1 sm:p-1.5 rounded-full transition-colors z-10 shadow-sm cursor-pointer ${
            isWishlisted
              ? 'bg-red-600 text-white'
              : 'bg-white/80 dark:bg-black/60 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-black'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add To Cart Button */}
        <button
          type="button"
          onClick={handleAddToCartClick}
          className={`absolute bottom-1.5 right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md border z-10 cursor-pointer transition-colors ${
            justAdded
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : isInCart
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-red-600 hover:border-red-600 hover:text-white'
          }`}
          title={isInCart ? `In Bag (${cartQuantity})` : 'Add to Bag'}
          aria-label="Add to Bag"
        >
          {justAdded ? (
            <Check className="w-3.5 h-3.5" />
          ) : isInCart ? (
            <ShoppingBag className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="p-2 sm:p-2.5 space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-0.5">
          {/* Category / Brand */}
          <div className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide font-medium truncate">
            {product.categoryLabel || product.category || 'TIMEVERA'}
          </div>

          {/* Title */}
          <h3 className="text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2 min-h-[2.2em]">
            {product.name}
          </h3>

          {/* Rating Badge */}
          {product.rating && Number(product.rating) > 0 && (
            <div className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-max mt-0.5">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{product.rating}</span>
            </div>
          )}
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-1.5 flex-wrap pt-1">
          <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            ₹{sellingPrice.toLocaleString('en-IN')}
          </span>
          {discountPercent > 0 && mrp > sellingPrice && (
            <span className="text-[10px] sm:text-xs text-zinc-500 line-through">
              ₹{mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-500">
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
