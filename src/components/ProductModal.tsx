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
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} on Timevera Watch for only ₹${price}! Quality tested luxury watch: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // user cancelled
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
    onClose();
    onBuyNow(product, selectedQty);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#131620] border border-[#252A36] shadow-2xl shadow-black/90 overflow-hidden my-8 rounded-2xl">
        {/* Top Action Buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full border transition-all flex items-center gap-1.5 text-xs px-3 cursor-pointer ${
              isWishlisted
                ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B0C10] shadow-md shadow-[#D4AF37]/20'
                : 'bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#D4AF37] border-[#252A36]'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#0B0C10] text-[#0B0C10]' : ''}`} />
            <span className="hidden sm:inline">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareProduct}
            className="p-2 bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#D4AF37] rounded-full border border-[#252A36] transition-colors flex items-center gap-1.5 text-xs px-3 cursor-pointer"
            title="Share this watch"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 bg-[#0B0C10]/90 hover:bg-[#1A1E2B] text-[#A7AFBF] hover:text-[#F8FAFC] rounded-full border border-[#252A36] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image Viewer */}
          <div className="p-6 bg-[#0B0C10] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#252A36]">
            <div className="relative aspect-square overflow-hidden bg-[#131620] rounded-xl mb-4 flex items-center justify-center border border-[#252A36]">
              <img
                src={images[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
              {product.tag && (
                <div className="absolute top-3 left-3 bg-[#D4AF37] text-[#0B0C10] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow">
                  {product.tag}
                </div>
              )}
            </div>

            {/* Thumbnail switcher */}
            {product.secondaryImage && (
              <div className="flex gap-2.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 border rounded-lg overflow-hidden transition-all bg-[#131620] p-1 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50'
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

          {/* Right: Specifications & Direct Actions */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-4 max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  {product.categoryLabel || product.category || 'TIMEVERA'}
                </span>
                {product.rating && Number(product.rating) > 0 && (
                  <div className="flex items-center gap-1 text-[#D4AF37] text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[#F8FAFC] font-bold">{product.rating}</span>
                    {product.reviewsCount && Number(product.reviewsCount) > 0 && (
                      <span className="text-[#A7AFBF]">({product.reviewsCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              <h2 className="font-brand text-2xl sm:text-3xl font-bold text-[#F8FAFC] mb-2">
                {product.name}
              </h2>

              <p className="text-[#A7AFBF] text-xs sm:text-sm leading-relaxed mb-3">
                {product.description}
              </p>

              {/* Pricing banner */}
              <div className="p-3.5 bg-[#0B0C10] border border-[#252A36] rounded-xl flex items-center justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-[#E5C07B]">
                    ₹{price.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-[#A7AFBF] ml-1.5">/ piece</span>
                  </div>
                  {discountPercent > 0 && originalPrice > price && (
                    <div className="flex items-center gap-2 text-xs">
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
                  <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 rounded">
                    In Stock • Ready to Ship
                  </span>
                </div>
              </div>

              {/* Delivery Pincode Estimator */}
              <div className="p-3.5 bg-[#0B0C10] border border-[#252A36] rounded-xl space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Check Delivery Pincode:</span>
                  </span>
                </div>

                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode (e.g. 201306)"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 bg-[#131620] border border-[#252A36] rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] placeholder-[#A7AFBF]/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4AF37] text-[#0B0C10] hover:bg-[#E5C07B] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>

                {deliveryEstimate && (
                  <div className={`p-2.5 rounded-lg text-xs ${
                    deliveryEstimate.valid
                      ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-800/80 text-rose-300'
                  }`}>
                    {deliveryEstimate.valid ? (
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Estimated Delivery: {deliveryEstimate.estimateText}</span>
                        </div>
                        <p className="text-[11px] text-[#A7AFBF]">
                          {deliveryEstimate.locationHint} • Dispatched from Greater Noida Hub.
                        </p>
                      </div>
                    ) : (
                      <p>{deliveryEstimate.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Selector Section */}
              <div className="p-3.5 bg-[#0B0C10] border border-[#252A36] rounded-xl space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <span>Select Quantity:</span>
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDecreaseQty}
                      className="w-7 h-7 rounded-lg bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer border border-[#252A36]"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="w-9 text-center font-extrabold text-[#F8FAFC] text-sm bg-[#131620] py-1 rounded-md border border-[#252A36]">
                      {selectedQty}
                    </span>

                    <button
                      type="button"
                      onClick={handleIncreaseQty}
                      className="w-7 h-7 rounded-lg bg-[#171A24] hover:bg-[#202534] text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer border border-[#252A36]"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Quantity Preset Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#A7AFBF] uppercase font-semibold">Quick:</span>
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedQty(num)}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer transition-all ${
                        selectedQty === num
                          ? 'bg-[#D4AF37] text-[#0B0C10] shadow'
                          : 'bg-[#171A24] text-[#A7AFBF] hover:bg-[#202534] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {num} {num === 1 ? 'pc' : 'pcs'}
                    </button>
                  ))}
                </div>

                {/* Total Calculated Summary */}
                {selectedQty > 1 && (
                  <div className="pt-2 border-t border-[#252A36] flex items-center justify-between text-xs">
                    <span className="text-[#A7AFBF]">Total ({selectedQty} watches):</span>
                    <div className="text-right">
                      <span className="text-[#E5C07B] font-extrabold text-sm">
                        ₹{totalPrice.toLocaleString('en-IN')}
                      </span>
                      {totalSavings > 0 && (
                        <span className="text-[10px] text-emerald-400 ml-2">
                          (Save ₹{totalSavings.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Specifications - Only shown if at least one spec is provided by Store */}
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

                // Also include any other custom attributes from Store attributes map
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
                  <div className="space-y-1.5 border-t border-b border-[#252A36] py-2.5 text-xs">
                    <div className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
                      Technical Specifications
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[#A7AFBF] text-[11px]">
                      {specs.map((s, idx) => (
                        <div key={idx}>
                          <span className="text-[#A7AFBF]/60 capitalize">{s.label}:</span> {s.value}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              {/* Order Now Button */}
              <button
                onClick={handleBuyNowClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-xl shadow-md hover:shadow-[#D4AF37]/20 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#0B0C10] fill-current" />
                <span>Order Now</span>
              </button>

              {/* Add to Shopping Bag Button */}
              <button
                onClick={handleAddToCartClick}
                className={`w-full py-2.5 px-4 border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer ${
                  justAdded
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : isInCart
                    ? 'bg-[#171A24] border-[#D4AF37]/60 text-[#E5C07B]'
                    : 'bg-[#0B0C10] border-[#252A36] text-[#F8FAFC] hover:border-[#D4AF37]/50 hover:text-[#E5C07B]'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Added {selectedQty} {selectedQty === 1 ? 'Watch' : 'Watches'} to Bag!</span>
                  </>
                ) : isInCart ? (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                    <span>In Bag ({cartQuantity}) • Add {selectedQty} More</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#D4AF37]" />
                    <span>Add {selectedQty > 1 ? `${selectedQty} Watches` : 'to Shopping Bag'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust footer */}
            <div className="grid grid-cols-3 gap-2 text-[10px] text-[#A7AFBF] pt-1 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>100% Inspected</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Direct Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

