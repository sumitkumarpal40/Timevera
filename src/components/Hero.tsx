import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';
import { TimeveraLogo } from './TimeveraLogo';

interface HeroProps {
  onShopClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopClick }) => {
  return (
    <section id="home" className="relative bg-[#0B0C10] overflow-hidden border-b border-[#252A36] transition-colors">
      {/* Background Subtle Gold & Obsidian Glow */}
      <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none opacity-80" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#131620] rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Official Emblem Logo Badge in Hero */}
          <div className="flex justify-center mb-1">
            <div className="p-3.5 sm:p-4 bg-[#131620] rounded-2xl border border-[#D4AF37]/35 shadow-2xl inline-block transform hover:scale-[1.02] transition-transform">
              <TimeveraLogo size="xl" variant="gold" showText={true} showTagline={true} />
            </div>
          </div>

          {/* Small Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131620] border border-[#D4AF37]/30 text-xs font-semibold text-[#E5C07B] tracking-wider uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Curated Timepieces & Accessories</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-brand text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F8FAFC] uppercase leading-tight">
            Time That <span className="bg-gradient-to-r from-[#F8E7B9] via-[#D4AF37] to-[#E5C07B] bg-clip-text text-transparent">Defines</span> You.
          </h1>

          {/* Subtitle */}
          <p className="text-[#A7AFBF] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Discover precision craftsmanship at transparent direct-to-customer pricing. Handcrafted luxury and everyday collections with quality assurance, movement warranty, and express home delivery.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onShopClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-bold text-xs tracking-widest uppercase transition-all shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer rounded-xl"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#131620] hover:bg-[#1A1E2B] border border-[#252A36] text-[#F8FAFC] font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-sm rounded-xl cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Help & Support</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-[#252A36] max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#A7AFBF]">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>100% Quality Inspected</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#A7AFBF]">
              <Truck className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>Pan India Fast Delivery</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 text-xs font-semibold text-[#A7AFBF]">
              <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>Direct Store Dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
