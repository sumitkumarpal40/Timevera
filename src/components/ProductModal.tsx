import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Plus,
  Minus,
  Check,
  Share2,
  Zap,
  ShoppingBag,
  Heart,
  MapPin,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { WatchProduct } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { getDeliveryEstimate, DeliveryEstimate } from '../lib/deliveryEstimator';
import { generateUniqueShortCode } from '../lib/productInventoryService';

interface ProductModalProps {
  product: WatchProduct | null;
  onClose: () => void;
  onAddToCart: (product: WatchProduct, quantity?: number) => void;
  onBuyNow: (product: WatchProduct, quantity?: number) => void;
  isInCart: boolean;
  cartQuantity?: number;
  onOpenCart?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  isInCart,
  cartQuantity = 0,
  onOpenCart,
}) => {
  const { isInWishlist, toggleWishlist, customer } = useCustomerAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Delivery Estimator state
  const [pincodeInput, setPincodeInput] = useState(customer?.pincode || '');
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(() => {
    if (customer?.pincode && customer.pincode.length === 6) {
      return getDeliveryEstimate(customer.pincode);
    }
    return null;
  });

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);
  const images = [product.image, product.secondaryImage || product.image];
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
  const totalPrice = price * selectedQty;
  const totalSavings = discountPercent > 0 && originalPrice > price ? (originalPrice - price) * selectedQty : 0;

  const handleShareProduct = async () => {
    const code = product.shortCode || generateUniqueShortCode(product.id);
    const shareUrl = `${window.location.origin}/#p/${code}`;
    const shareText = `Check out ${product.name} on Timevera Watch for only ₹${price}! Quality tested luxury watch: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Share failed:', err);
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = getDeliveryEstimate(pincodeInput);
    setDeliveryEstimate(result);
  };

  const handleIncreaseQty = () => {
    setSelectedQty((prev) => Math.min(prev + 1, 99));
  };

  const handleDecreaseQty = () => {
    setSelectedQty((prev) => Math.max(prev - 1, 1));
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, selectedQty);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-[92vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-[#131620] border border-[#252A36] shadow-2xl shadow-black/90 overflow-hidden my-4 sm:my-8 rounded-xl sm:rounded-2xl max-h-[92vh] flex flex-col">
        {/* Top Action Buttons */}
        <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-30 flex items-center gap-1 sm:gap-2">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`p-1 sm:p-1.5 rounded-full border transition-all flex items-center gap-1 text-[10px] px-2 sm:px-2.5 cursor-pointer ${
              isWishlisted
                ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B0C10] shadow-md shadow-[#D4AF37]/20'
                : 'bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#D4AF37] border-[#252A36]'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-[#0B0C10] text-[#0B0C10]' : ''}`} />
            <span className="hidden sm:inline">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareProduct}
            className="p-1 sm:p-1.5 bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#D4AF37] rounded-full border border-[#252A36] transition-colors flex items-center gap-1 text-[10px] px-2 sm:px-2.5 cursor-pointer"
            title="Share this watch"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#F8FAFC] rounded-full border border-[#252A36] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Image Viewer */}
            <div className="bg-transparent flex flex-col border-b md:border-b-0 md:border-r border-[#252A36]">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-transparent">
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {product.tag && (
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#D4AF37] text-[#0B0C10] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded shadow z-10">
                    {product.tag}
                  </div>
                )}
              </div>

              {/* Thumbnail switcher */}
              {product.secondaryImage && (
                <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-8 h-8 sm:w-12 sm:h-12 border rounded-md overflow-hidden transition-all bg-[#131620] p-0.5 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50'
                          : 'border-[#252A36] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Specifications & Info */}
            <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    {product.categoryLabel || product.category || 'TIMEVERA'}
                  </span>
                  {product.rating && Number(product.rating) > 0 && (
                    <div className="flex items-center gap-0.5 text-[#D4AF37] text-[10px] sm:text-[11px]">
                      <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current" />
                      <span className="text-[#F8FAFC] font-bold">{product.rating}</span>
                      {product.reviewsCount && Number(product.reviewsCount) > 0 && (
                        <span className="text-[#A7AFBF]">({product.reviewsCount})</span>
                      )}
                    </div>
                  )}
                </div>

                <h2 className="font-brand text-sm sm:text-base font-bold text-[#F8FAFC] mb-1">
                  {product.name}
                </h2>

                <p className="text-[#A7AFBF] text-[11px] sm:text-xs leading-snug mb-1.5 sm:mb-2">
                  {product.description}
                </p>

                {/* Pricing banner */}
                <div className="p-1.5 sm:p-2 bg-[#0B0C10] border border-[#252A36] rounded-lg flex items-center justify-between mb-1.5 sm:mb-2">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-[#E5C07B]">
                      ₹{price.toLocaleString('en-IN')}
                      <span className="text-[10px] sm:text-xs font-normal text-[#A7AFBF] ml-1">/ piece</span>
                    </div>
                    {discountPercent > 0 && originalPrice > price && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <span className="text-[#A7AFBF]/60 line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          Save {discountPercent}% off
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 rounded">
                      In Stock • Ready to Ship
                    </span>
                  </div>
                </div>

                {/* Delivery Pincode Estimator */}
                <div className="p-1.5 sm:p-2 bg-[#0B0C10] border border-[#252A36] rounded-lg space-y-1 sm:space-y-1.5 mb-1.5 sm:mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold text-[#F8FAFC] flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#D4AF37]" />
                      <span>Check Delivery Pincode:</span>
                    </span>
                  </div>

                  <form onSubmit={handleCheckPincode} className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode"
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 h-7 sm:h-8 px-2 py-1 bg-[#131620] border border-[#252A36] rounded-md text-[11px] text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] placeholder-[#A7AFBF]/50"
                    />
                    <button
                      type="submit"
                      className="px-2.5 sm:px-3 py-1 bg-[#D4AF37] text-[#0B0C10] hover:bg-[#E5C07B] text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                    >
                      Check
                    </button>
                  </form>

                  {deliveryEstimate && (
                    <div className={`p-1.5 sm:p-2 rounded-md text-[10px] sm:text-[11px] ${
                      deliveryEstimate.valid
                        ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-800/80 text-rose-300'
                    }`}>
                      {deliveryEstimate.valid ? (
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1 text-[10px] sm:text-[11px]">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Delivery: {deliveryEstimate.estimateText}</span>
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-[#A7AFBF]">
                            {deliveryEstimate.locationHint}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px]">{deliveryEstimate.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity Selector Section */}
                <div className="p-1.5 sm:p-2 bg-[#0B0C10] border border-[#252A36] rounded-lg space-y-1 sm:space-y-1.5 mb-1.5 sm:mb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] sm:text-xs font-bold text-[#F8FAFC] flex items-center gap-1">
                      <span>Select Quantity:</span>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={handleDecreaseQty}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer border border-[#252A36]"
                        title="Decrease quantity"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>

                      <span className="w-6 sm:w-7 text-center font-extrabold text-[#F8FAFC] text-[11px] sm:text-xs bg-[#131620] py-0.5 rounded border border-[#252A36]">
                        {selectedQty}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncreaseQty}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer border border-[#252A36]"
                        title="Increase quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Quantity Preset Pills */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[9px] text-[#A7AFBF] uppercase font-semibold">Quick:</span>
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedQty(num)}
                        className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded cursor-pointer transition-all ${
                          selectedQty === num
                            ? 'bg-[#D4AF37] text-[#0B0C10] shadow'
                            : 'bg-[#171A24] text-[#A7AFBF] hover:bg-[#202534] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {num}{num === 1 ? 'pc' : 'pcs'}
                      </button>
                    ))}
                  </div>

                  {/* Total Calculated Summary */}
                  {selectedQty > 1 && (
                    <div className="pt-1 border-t border-[#252A36] flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="text-[#A7AFBF]">Total:</span>
                      <div className="text-right">
                        <span className="text-[#E5C07B] font-extrabold">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                        {totalSavings > 0 && (
                          <span className="text-[8px] sm:text-[9px] text-emerald-400 ml-1">
                            (Save ₹{totalSavings.toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Technical Specifications */}
                {(() => {
                  const specs: { label: string; value: string }[] = [];

                  const dialVal = product.dial || product.dialColor || product.attributes?.dial || product.attributes?.['Dial'] || product.attributes?.['Dial Color'];
                  if (dialVal && dialVal.trim()) specs.push({ label: 'Dial', value: dialVal.trim() });

                  const caseVal = product.case || product.caseSize || product.attributes?.case || product.attributes?.['Case'] || product.attributes?.['Case Size'];
                  if (caseVal && caseVal.trim()) specs.push({ label: 'Case', value: caseVal.trim() });

                  const strapVal = product.strap || product.strapMaterial || product.attributes?.strap || product.attributes?.['Strap'] || product.attributes?.['Strap Material'];
                  if (strapVal && strapVal.trim()) specs.push({ label: 'Strap', value: strapVal.trim() });

                  const movementVal = product.movement || product.attributes?.movement || product.attributes?.['Movement'];
                  if (movementVal && movementVal.trim()) specs.push({ label: 'Movement', value: movementVal.trim() });

                  const waterVal = product.waterResistance || 
                    (typeof product.waterResistant === 'string' && product.waterResistant.trim() ? product.waterResistant.trim() : product.waterResistant ? 'Water Resistant' : '') || 
                    product.attributes?.waterResistance || product.attributes?.['Water Resistance'] || product.attributes?.waterResistant;
                  if (waterVal && waterVal.trim()) specs.push({ label: 'Water Res.', value: waterVal.trim() });

                  const warrantyVal = product.warranty || 
                    (product.warrantyMonths ? `${product.warrantyMonths} Months` : '') || 
                    product.warrantyInfo || 
                    product.attributes?.warranty || product.attributes?.['Warranty'];
                  if (warrantyVal && warrantyVal.trim()) specs.push({ label: 'Warranty', value: warrantyVal.trim() });

                  if (product.attributes) {
                    const standardKeys = new Set(['dial', 'dial color', 'case', 'case size', 'strap', 'strap material', 'movement', 'water resistance', 'waterresistant', 'warranty']);
                    Object.entries(product.attributes).forEach(([key, val]) => {
                      if (val && typeof val === 'string' && val.trim() && !standardKeys.has(key.toLowerCase())) {
                        specs.push({ label: key, value: val.trim() });
                      }
                    });
                  }

                  if (specs.length === 0) return null;

                  return (
                    <div className="space-y-1 border-t border-b border-[#252A36] py-1.5 sm:py-2">
                      <div className="text-[10px] sm:text-[11px] font-bold text-[#D4AF37] uppercase tracking-wide">
                        Specifications
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#A7AFBF] text-[10px] sm:text-xs">
                        {specs.map((s, idx) => (
                          <div key={idx} className="flex gap-1">
                            <span className="text-[#A7AFBF]/60 capitalize whitespace-nowrap">{s.label}:</span>
                            <span className="truncate">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons & Trust Footer - Sticky */}
        <div className="flex-shrink-0 p-2 sm:p-3 bg-[#131620] border-t border-[#252A36] space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {/* Buy Now Button */}
            <button
              onClick={handleBuyNowClick}
              className="flex-1 py-1.5 sm:py-2 px-3 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all rounded-lg shadow-md cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#0B0C10] fill-current" />
              <span>Buy Now</span>
            </button>

            {/* Add to Shopping Bag Button */}
            <button
              onClick={handleAddToCartClick}
              className={`flex-1 py-1.5 sm:py-2 px-3 border text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all rounded-lg cursor-pointer ${
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
                  <span className="hidden sm:inline">Added!</span>
                  <span className="sm:hidden">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isInCart ? 'In Bag' : 'Add to Bag'}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust footer */}
          <div className="grid grid-cols-3 gap-1 text-[9px] sm:text-[10px] text-[#A7AFBF] pt-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <Truck className="w-3 h-3 text-[#D4AF37]" />
              <span>Fast Dispatch</span>
            </div>
            <div className="flex items-center justify-center gap-1 border-x border-[#252A36]">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
              <span>100% Inspected</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
              <span>Direct Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


