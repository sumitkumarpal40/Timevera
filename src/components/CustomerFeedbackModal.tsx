import React, { useState } from 'react';
import {
  X,
  Star,
  CheckCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  Watch,
  RefreshCw,
} from 'lucide-react';
import { CustomerReviewFeedback, StoreOrder } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { submitCustomerFeedback } from '../lib/customerService';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: StoreOrder | null;
  productName?: string;
  onSuccess?: () => void;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  order,
  productName,
  onSuccess,
}) => {
  const { customer } = useCustomerAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<string>(
    productName || (order?.items?.[0]?.name ?? 'Timevera Premium Product')
  );
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('कृपया अपनी राय या सुझाव (Feedback comment) लिखें');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const reviewId = 'REV-' + Math.floor(100000 + Math.random() * 900000);
      const newReview: CustomerReviewFeedback = {
        id: reviewId,
        customerPhone: customer?.phone || order?.customerPhone || '9876543210',
        customerName: customer?.fullName || order?.customerName || 'Timevera Customer',
        orderId: order?.id,
        productName: selectedProduct,
        rating: rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        verifiedBuyer: true,
      };

      await submitCustomerFeedback(newReview);
      setIsSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg('फीडबैक सबमिट करने में त्रुटि हुई');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141414] text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold">
                Customer Rating & Feedback
              </h3>
              <p className="text-[11px] text-red-100">
                रिव्यू और सुझाव साझा करें • 100% Verified Buyer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h4 className="font-brand font-bold text-xl text-zinc-900 dark:text-white">
                Feedback Submitted!
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aapka anmol review Timevera team ke paas save ho gaya hai. Dhanyawaad!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selection if Order has multiple items */}
              {order && order.items && order.items.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Select Product (उत्पाद चुनें):
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    {order.items.map((it, idx) => (
                      <option key={idx} value={it.name}>
                        {it.name} (₹{it.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="text-center p-4 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  How was your experience with {selectedProduct}?
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="inline-block text-xs font-extrabold text-amber-500 dark:text-amber-400">
                  {rating === 5 && '⭐⭐⭐⭐⭐ Outstanding / Excellent'}
                  {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                  {rating === 3 && '⭐⭐⭐ Good / Average'}
                  {rating === 2 && '⭐⭐ Below Expectations'}
                  {rating === 1 && '⭐ Poor'}
                </span>
              </div>

              {/* Review Headline / Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Review Headline (मुख्य शीर्षक - Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Great quality product, premium look!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Review Details */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Your Detailed Review & Feedback (अपनी राय लिखें) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghadi ka design, dial finish, strap quality ya delivery experience kaisa laga?..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Verified Buyer Badge */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Verified Buyer Review • Will be permanently saved to your account</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Review (रिव्यू भेजें)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
