import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Zap,
  ShieldCheck,
  User,
  LogIn,
  Tag,
  Check,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { BUSINESS_INFO } from '../data/watches';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { validateCoupon, STORE_COUPONS, CouponValidationResult } from '../lib/couponService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: (appliedCoupon?: CouponValidationResult | null) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
}) => {
  const { customer, isLoggedIn, openLoginModal } = useCustomerAuth();
  const { t } = useLanguage();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalSavings = cartItems.reduce(
    (sum, item) =>
      sum + (item.product.originalPrice - item.product.price) * item.quantity,
    0
  );

  const couponDiscount = appliedCoupon && appliedCoupon.valid ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await validateCoupon(code, subtotal, customer?.uid);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponInput(res.code);
      } else {
        setCouponError(res.message);
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex justify-end animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-[#0B0C10] border-l border-[#252A36] h-full flex flex-col justify-between shadow-2xl">
        {/* Drawer Header */}
        <div className="p-3 sm:p-4 border-b border-[#252A36] flex items-center justify-between bg-[#131620]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
            <h2 className="font-brand text-base sm:text-lg font-bold text-[#F8FAFC] tracking-wide">
              {t.yourCart}
            </h2>
            <span className="bg-[#D4AF37]/10 text-[#E5C07B] text-[10px] sm:text-xs font-semibold px-2 py-0.5 border border-[#D4AF37]/30 rounded">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A7AFBF] hover:text-[#F8FAFC] rounded-full hover:bg-[#1A1E2B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-[#0B0C10]">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="p-3.5 sm:p-4 bg-[#131620] border border-[#252A36] rounded-full text-[#A7AFBF]">
                <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-[#D4AF37]/60" />
              </div>
              <div>
                <h3 className="font-brand text-sm sm:text-base font-bold text-[#F8FAFC] mb-1">Your bag is empty</h3>
                <p className="text-xs text-[#A7AFBF] max-w-xs leading-relaxed">
                  Explore our luxury collection and click ORDER NOW to place your order directly.
                </p>
              </div>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 sm:p-3 bg-[#131620] border border-[#252A36] rounded-xl flex gap-2 sm:gap-3 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover bg-[#0B0C10] rounded-lg border border-[#252A36] flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-brand text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-[#D4AF37] font-medium mb-0.5">
                      {item.product.categoryLabel}
                    </p>
                    <div className="text-sm sm:text-base font-bold text-[#E5C07B]">
                      ₹{((Number(item.product.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                      <div className="flex items-center border border-[#252A36] bg-[#0B0C10] rounded">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center text-[#A7AFBF] hover:text-[#F8FAFC] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#F8FAFC]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center text-[#A7AFBF] hover:text-[#F8FAFC] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-[#A7AFBF] hover:text-rose-400 text-xs p-1 cursor-pointer"
                        title="Remove watch"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon / Promo Code Section */}
              <div className="p-2.5 sm:p-3.5 bg-[#131620] border border-[#252A36] rounded-xl space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#F8FAFC] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-xs sm:text-sm">Apply Coupon:</span>
                  </span>
                  {appliedCoupon && appliedCoupon.valid && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {appliedCoupon && appliedCoupon.valid ? (
                  <div className="p-2 sm:p-2.5 bg-emerald-950/40 border border-emerald-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-extrabold font-mono text-xs">{appliedCoupon.code}</span>
                        <span className="text-[10px] sm:text-[11px] ml-1.5">(-₹{(Number(appliedCoupon.discountAmount) || 0).toLocaleString('en-IN')})</span>
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                      APPLIED
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. TIMEVERA100"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-2.5 sm:px-3 py-2 bg-[#0B0C10] border border-[#252A36] rounded-lg text-xs sm:text-sm text-[#F8FAFC] uppercase font-mono tracking-wider focus:outline-none focus:border-[#D4AF37] placeholder-[#A7AFBF]/50"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="px-3 sm:px-3.5 py-2 bg-[#D4AF37] text-[#0B0C10] hover:bg-[#E5C07B] disabled:opacity-50 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        {isValidatingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[10px] sm:text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{couponError}</span>
                      </p>
                    )}

                    {/* Quick suggestion coupon chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {STORE_COUPONS.slice(0, 2).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          className="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold bg-[#0B0C10] hover:border-[#D4AF37]/60 border border-[#252A36] text-[#E5C07B] rounded cursor-pointer transition-colors"
                        >
                          {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`} OFF)
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-1 text-right">
                <button
                  onClick={onClearCart}
                  className="text-[11px] sm:text-xs text-[#A7AFBF] hover:text-[#F8FAFC] underline cursor-pointer"
                >
                  Clear Bag
                </button>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Checkout */}
        {cartItems.length > 0 && (
          <div className="p-3 sm:p-4 bg-[#131620] border-t border-[#252A36] space-y-2.5 sm:space-y-3">
            {/* Customer Account Status */}
            {isLoggedIn && customer ? (
              <div className="p-2 sm:p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] sm:text-[11px] truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Profile: <strong>{customer.fullName || 'Customer'}</strong></span>
                </div>
                <span className="text-[8px] sm:text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                  Ready
                </span>
              </div>
            ) : (
              <div className="p-2 sm:p-2.5 bg-[#0B0C10] border border-[#252A36] rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#E5C07B] text-[10px] sm:text-[11px]">
                  <User className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                  <span>Profile required to place order</span>
                </div>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="px-2 sm:px-2.5 py-1 bg-[#D4AF37] text-[#0B0C10] hover:bg-[#E5C07B] text-[9px] sm:text-[10px] font-bold rounded-lg uppercase transition-colors cursor-pointer"
                >
                  Login OTP
                </button>
              </div>
            )}

            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between text-[#A7AFBF]">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)} watches):</span>
                <span className="text-[#F8FAFC] font-medium">
                  ₹{(Number(subtotal) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Product Savings:</span>
                <span>₹{(Number(totalSavings) || 0).toLocaleString('en-IN')}</span>
              </div>
              {(Number(couponDiscount) || 0) > 0 && (
                <div className="flex justify-between text-[#E5C07B] font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span>-₹{(Number(couponDiscount) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#A7AFBF]">
                <span>Delivery:</span>
                <span className="text-emerald-400 font-bold uppercase">FREE</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-[#F8FAFC] pt-1.5 sm:pt-2 border-t border-[#252A36]">
                <span>Order Total:</span>
                <span className="text-[#E5C07B] font-extrabold text-base sm:text-lg">
                  ₹{(Number(finalTotal) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Primary Action */}
            <button
              onClick={() => {
                onClose();
                onOpenCheckout(appliedCoupon);
              }}
              className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-xl shadow-md hover:shadow-[#D4AF37]/20 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#0B0C10] fill-current" />
              <span>PROCEED TO ORDER (₹{(Number(finalTotal) || 0).toLocaleString('en-IN')})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] text-[#A7AFBF]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Direct Store Billing • Express Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

