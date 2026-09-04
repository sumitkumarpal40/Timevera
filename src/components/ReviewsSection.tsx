import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Quote, PlusCircle, MessageSquarePlus } from 'lucide-react';
import { REVIEWS_DATA } from '../data/watches';
import { fetchCustomerReviews } from '../lib/customerService';
import { CustomerReviewFeedback } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CustomerFeedbackModal } from './CustomerFeedbackModal';

export const ReviewsSection: React.FC = () => {
  const { isLoggedIn, openLoginModal } = useCustomerAuth();
  const [liveReviews, setLiveReviews] = useState<CustomerReviewFeedback[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomerReviews().then((revs) => {
      if (revs && revs.length > 0) {
        setLiveReviews(revs);
      }
    });
  }, []);

  const handleWriteReviewClick = () => {
    if (!isLoggedIn) {
      openLoginModal();
    } else {
      setIsFeedbackModalOpen(true);
    }
  };

  return (
    <>
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252A36]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Customer Satisfaction & Trust
            </span>
            <h2 className="font-brand text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] mt-1 mb-2">
              What Our Buyers Say
            </h2>
            <p className="text-[#A7AFBF] text-sm sm:text-base">
              Verified reviews from watch connoisseurs across Delhi NCR & all over India
            </p>
          </div>

          <button
            onClick={handleWriteReviewClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer self-start md:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review / Feedback</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Live Customer Reviews (if any) */}
          {liveReviews.slice(0, 3).map((rev) => (
            <div
              key={rev.id}
              className="p-6 bg-[#131620] border border-[#D4AF37]/30 rounded-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/60 transition-all shadow-sm"
            >
              <Quote className="absolute top-4 right-4 w-7 h-7 text-[#D4AF37]/20 pointer-events-none" />

              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] mb-2">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>

                {rev.title && (
                  <h4 className="text-sm font-bold text-[#F8FAFC] mb-1.5">
                    "{rev.title}"
                  </h4>
                )}

                <p className="text-[#F8FAFC] text-sm italic leading-relaxed mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#252A36] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC] text-sm">
                    <span>{rev.customerName}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ✓ Verified Buyer
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#E5C07B] font-medium block">
                    {rev.productName}
                  </span>
                  <span className="text-[10px] text-[#A7AFBF]">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Seed Reviews */}
          {REVIEWS_DATA.slice(0, Math.max(0, 3 - Math.min(3, liveReviews.length)) || 3).map((rev) => (
            <div
              key={rev.id}
              className="p-6 bg-[#131620] border border-[#252A36] rounded-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/40 transition-all"
            >
              <Quote className="absolute top-4 right-4 w-7 h-7 text-[#D4AF37]/15 pointer-events-none" />

              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] mb-3">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>

                <p className="text-[#F8FAFC] text-sm italic leading-relaxed mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#252A36] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC] text-sm">
                    <span>{rev.author}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-[#A7AFBF]">{rev.location}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#E5C07B] font-medium block">
                    {rev.watchPurchased}
                  </span>
                  <span className="text-[10px] text-[#A7AFBF]/60">{rev.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSuccess={() => {
          fetchCustomerReviews().then((revs) => {
            if (revs && revs.length > 0) setLiveReviews(revs);
          });
        }}
      />
    </>
  );
};

