import React from 'react';
import { Sparkles, ShieldCheck, Award, Truck } from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-[#0B0C10] border-y border-[#252A36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left info column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#131620] border border-[#D4AF37]/30 text-[#E5C07B] text-xs font-semibold tracking-widest uppercase rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Our Story & Vision</span>
            </div>

            <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F8FAFC] leading-tight">
              About Timevera
            </h2>

            <p className="text-[#F8FAFC] text-base sm:text-lg leading-relaxed">
              <strong className="text-[#E5C07B]">Timevera</strong> brings stylish, affordable, and premium products for every occasion. From everyday statement pieces to prestigious milestone gifts, we offer fine craftsmanship across our entire catalogue.
            </p>

            <p className="text-[#A7AFBF] text-sm sm:text-base leading-relaxed">
              We believe a fine product isn't just an accessory—it's a signature of confidence and individuality. By connecting with our customers directly via our store ordering system, we deliver exceptional craftsmanship with transparent pricing and dedicated customer care.
            </p>

            {/* Core Values Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-[#131620] border border-[#252A36] rounded-xl hover:border-[#D4AF37]/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2 text-[#D4AF37]">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-brand font-bold text-[#F8FAFC] text-base">Quality Inspected</h3>
                </div>
                <p className="text-xs text-[#A7AFBF] leading-normal">
                  Every product and its components are individually inspected prior to safe packaging and dispatch.
                </p>
              </div>

              <div className="p-4 bg-[#131620] border border-[#252A36] rounded-xl hover:border-[#D4AF37]/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2 text-[#D4AF37]">
                  <Award className="w-5 h-5" />
                  <h3 className="font-brand font-bold text-[#F8FAFC] text-base">Honest Pricing</h3>
                </div>
                <p className="text-xs text-[#A7AFBF] leading-normal">
                  Products curated with direct-to-customer transparency without intermediate retail markups.
                </p>
              </div>
            </div>
          </div>

          {/* Right Brand Identity Box */}
          <div className="lg:col-span-5">
            <div className="relative p-7 sm:p-8 bg-[#131620] border border-[#252A36] rounded-2xl shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-2xl pointer-events-none" />

              <div className="text-center pb-6 border-b border-[#252A36]">
                <div className="font-brand text-2xl sm:text-3xl font-bold tracking-[4px] text-[#F8FAFC]">
                  TIMEVERA
                </div>
                <div className="text-xs tracking-[8px] text-[#D4AF37] font-semibold mt-1">
                  STORE
                </div>
                <p className="text-xs text-[#A7AFBF] italic mt-3">
                  "{BUSINESS_INFO.tagline}"
                </p>
              </div>

              <div className="py-6 space-y-3.5 text-xs text-[#A7AFBF]">
                <div className="flex items-center justify-between">
                  <span className="text-[#A7AFBF]/70">Curated Portfolios:</span>
                  <span className="font-semibold text-[#F8FAFC]">Full Brand Catalogue</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A7AFBF]/70">Ordering System:</span>
                  <span className="font-semibold text-[#E5C07B]">Direct 3-Step Store Checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A7AFBF]/70">Base Location:</span>
                  <span className="font-semibold text-[#F8FAFC]">Greater Noida, UP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A7AFBF]/70">Delivery Coverage:</span>
                  <span className="font-semibold text-[#F8FAFC]">Pan-India Courier (COD & UPI)</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 bg-[#0B0C10] border border-[#252A36] text-center text-xs text-[#F8FAFC] rounded-lg">
                  <span className="text-emerald-400 font-bold">✓ 100% Secure Direct Ordering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
