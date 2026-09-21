import React, { useState } from 'react';
import { Eye, Plus, Minus, Check, Star, Share2, Zap, ShoppingBag, Heart } from 'lucide-react';
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
  onBuyNow,
  isInCart,
  cartQuantity = 0,
  onUpdateCartQuantity,
  onOpenCart,
}) => {
  const { isInWishlist, toggleWishlist } = useCustomerAuth();
  const [copied, setCopied] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  // Implement exact requested price logic with backwards compatibility support
  const mrp = Number(product.originalPrice || product.price || 0);
  const sellingPrice = Number(product.discountPrice) > 0
    ? Number(product.discountPrice)
    : Number(product.price) || 0;
  
  const price = sellingPrice;
  const originalPrice = mrp;

  const discountPercent = (mrp > sellingPrice && mrp > 0)
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0;

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} on Timevera for just ₹${price}! Quality tested premium product: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleIncreaseQty = () => {
    setSelectedQty((prev) => Math.min(prev + 1, 50));
  };

  const handleDecreaseQty = () => {
    setSelectedQty((prev) => Math.max(prev - 1, 1));
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, selectedQty);
  };

  const currentTotalPrice = price * selectedQty;

  return (
    <div className="group bg-[#131620] border border-[#252A36] hover:border-[#D4AF37]/50 p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 relative rounded-xl">
      {/* Top Left Badges */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {product.tag && (
          <span className="bg-[#D4AF37] text-[#0B0C10] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow-md rounded">
            {product.tag}
          </span>
        )}
        {discountPercent > 0 && (
          <span className="bg-[#0B0C10]/90 backdrop-blur-sm border border-[#252A36] text-[#E5C07B] text-[10px] font-bold px-2 py-0.5 rounded">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Top Right Action Buttons: Wishlist & Share */}
      <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5">
        <button
          onClick={handleWishlistClick}
          className={`p-1.5 rounded-full border transition-all shadow-sm cursor-pointer ${
            isWishlisted
              ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B0C10] shadow-[#D4AF37]/20'
              : 'bg-[#0B0C10]/80 hover:bg-[#1A1E2B] border-[#252A36] text-[#A7AFBF] hover:text-[#D4AF37]'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#0B0C10] text-[#0B0C10]' : ''}`} />
        </button>

        <button
          onClick={handleShareProduct}
          className="p-1.5 bg-[#0B0C10]/80 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#D4AF37] rounded-full border border-[#252A36] transition-colors shadow-sm cursor-pointer"
          title="Share Product Link"
          aria-label="Share Product"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div>
        {/* Product Image Stage */}
        <div className="relative aspect-[4/5] bg-[#0B0C10] overflow-hidden mb-3.5 cursor-pointer rounded-lg border border-[#252A36]/80 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onClick={() => onQuickView(product)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />

          {/* Hover Quick View Overlay Button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto backdrop-blur-[2px]">
            <button
              onClick={() => onQuickView(product)}
              className="bg-[#0B0C10]/95 hover:bg-[#131620] text-[#F8FAFC] text-xs font-semibold px-3 py-1.5 border border-[#D4AF37]/50 flex items-center gap-1.5 transition-colors cursor-pointer rounded-lg shadow-xl"
            >
              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Specs & View</span>
            </button>
          </div>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-[#A7AFBF] mb-1">
          <span className="uppercase tracking-wider text-[10px] text-[#D4AF37] font-bold">
            {product.categoryLabel || product.category || 'TIMEVERA'}
          </span>
          {product.rating && Number(product.rating) > 0 && (
            <div className="flex items-center gap-1 text-[#D4AF37]">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[11px] text-[#F8FAFC] font-medium">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onQuickView(product)}
          className="font-brand text-base sm:text-lg font-bold text-[#F8FAFC] group-hover:text-[#E5C07B] transition-colors cursor-pointer line-clamp-1 mb-1"
        >
          {product.name}
        </h3>

        {/* Specs snippet */}
        <p className="text-xs text-[#A7AFBF] line-clamp-1 mb-2.5">
          {product.attributes
            ? Object.values(product.attributes).slice(0, 2).join(' • ')
            : [product.attributes?.size, product.attributes?.color].filter(Boolean).join(' • ')}
        </p>

        {/* Price Row */}
        <div className="flex items-baseline justify-between gap-2 mb-3 bg-[#0B0C10] p-2.5 rounded-lg border border-[#252A36]">
          <div className="flex items-baseline gap-2">
            <span className="text-[#E5C07B] font-extrabold text-lg sm:text-xl">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {discountPercent > 0 && originalPrice > price && (
              <span className="text-[#A7AFBF]/60 line-through text-xs">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {selectedQty > 1 && (
            <span className="text-xs font-bold text-[#D4AF37]">
              Total: ₹{currentTotalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Quantity Selector Section */}
        <div className="flex items-center justify-between bg-[#0B0C10] border border-[#252A36] rounded-lg px-2.5 py-1.5 mb-3">
          <div className="text-[11px] text-[#A7AFBF] font-medium flex items-center gap-1">
            <span>Quantity:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDecreaseQty}
              className="w-5.5 h-5.5 rounded bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer text-xs border border-[#252A36]"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>

            <span className="w-6 text-center font-bold text-[#F8FAFC] text-xs py-0.5">
              {selectedQty}
            </span>

            <button
              type="button"
              onClick={handleIncreaseQty}
              className="w-5.5 h-5.5 rounded bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer text-xs border border-[#252A36]"
              title="Increase quantity"
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2 pt-2 border-t border-[#252A36]">
        {/* Instant Order Now Button */}
        <button
          onClick={handleBuyNowClick}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 rounded-lg shadow-md hover:shadow-[#D4AF37]/20 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-[#0B0C10] fill-current" />
          <span>Order Now</span>
        </button>

        {/* Add to Bag & Details */}
        <div className="flex gap-2">
          <button
            onClick={handleAddToCartClick}
            className={`flex-1 py-2 px-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border rounded-lg cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : isInCart
                ? 'bg-[#171A24] border-[#D4AF37]/60 text-[#E5C07B]'
                : 'bg-[#0B0C10] border-[#252A36] text-[#F8FAFC] hover:border-[#D4AF37]/50 hover:text-[#E5C07B]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added ({selectedQty})!</span>
              </>
            ) : isInCart ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>In Bag ({cartQuantity}) + Add</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Add to Bag</span>
              </>
            )}
          </button>

          <button
            onClick={() => onQuickView(product)}
            className="py-2 px-3 bg-[#0B0C10] hover:bg-[#171A24] border border-[#252A36] text-[#A7AFBF] hover:text-[#F8FAFC] text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="View full specs"
          >
            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

