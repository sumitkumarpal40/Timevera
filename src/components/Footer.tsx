import React from 'react';
import { Phone, Mail, MapPin, Smartphone, ShieldCheck, FileText, HelpCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';
import { TimeveraLogo } from './TimeveraLogo';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenInstallApp?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms' | 'shipping' | 'refund' | 'cancellation' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenInstallApp,
  onOpenLegal,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B0C10] text-[#A7AFBF] border-t border-[#252A36] transition-colors">
      {/* Top Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
        {/* Brand Col with Logo */}
        <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
          {/* Official Timevera Logo in Footer */}
          <div className="inline-block">
            <TimeveraLogo size="lg" variant="gold" showTagline={true} />
          </div>

          <p className="font-brand text-[#E5C07B] text-[11px] sm:text-xs italic font-semibold">
            "{BUSINESS_INFO.tagline}"
          </p>

          <p className="text-[11px] sm:text-xs text-[#A7AFBF] max-w-sm leading-relaxed">
            Discover exquisite craftsmanship and affordable luxury timepieces designed for discerning wearers. Direct store dispatch with instant order tracking & digital invoices.
          </p>

          {onOpenInstallApp && (
            <div className="pt-1 sm:pt-2">
              <button
                onClick={onOpenInstallApp}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#131620] hover:bg-[#1A1E2B] border border-[#252A36] hover:border-[#D4AF37]/50 text-[#F8FAFC] text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all rounded-lg shadow-md cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                <span>Install Mobile App</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="font-brand text-[#F8FAFC] font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider text-[#D4AF37]">
            Portfolios
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs md:text-sm">
            <li>
              <button
                onClick={() => scrollTo('shop')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                Budget Collection
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('shop')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                Style Collection
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('shop')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                Premium Collection
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('shop')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                Gift & Couple Sets
              </button>
            </li>
          </ul>
        </div>

        {/* Policies & Customer Care */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="font-brand text-[#F8FAFC] font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Customer Policies</span>
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs md:text-sm">
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('privacy')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('terms')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left"
              >
                Terms & Conditions
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('shipping')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left"
              >
                Shipping Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('refund')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left"
              >
                Return & Refund Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('cancellation')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left"
              >
                Cancellation Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal && onOpenLegal('contact')}
                className="hover:text-[#E5C07B] transition-colors cursor-pointer text-left font-semibold text-[#D4AF37]"
              >
                Contact & Support Hub
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="col-span-2 sm:col-span-1 space-y-2.5 sm:space-y-3">
          <div className="font-brand text-[#F8FAFC] font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider text-[#D4AF37]">
            Direct Contact
          </div>
          <ul className="space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs md:text-sm">
            <li className="flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              <button
                onClick={() => scrollTo('contact')}
                className="text-[#F8FAFC] hover:text-[#E5C07B] text-left cursor-pointer transition-colors"
              >
                Raise Support Ticket
              </button>
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="hover:text-[#E5C07B] text-[#F8FAFC] transition-colors font-mono"
              >
                {BUSINESS_INFO.email}
              </a>
            </li>
            <li className="flex items-start gap-1.5 sm:gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <span>Village Mubarikpur, Post Surajpur, Greater Noida, UP - 201306</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#252A36] py-4 sm:py-6 text-center px-4 space-y-2 bg-[#060709]">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-[#A7AFBF] pb-1.5 sm:pb-2">
          <button onClick={() => onOpenLegal && onOpenLegal('privacy')} className="hover:text-[#E5C07B] cursor-pointer">
            Privacy
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal && onOpenLegal('terms')} className="hover:text-[#E5C07B] cursor-pointer">
            Terms
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal && onOpenLegal('shipping')} className="hover:text-[#E5C07B] cursor-pointer">
            Shipping
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal && onOpenLegal('refund')} className="hover:text-[#E5C07B] cursor-pointer">
            Returns
          </button>
          <span>•</span>
          <button onClick={() => onOpenLegal && onOpenLegal('contact')} className="hover:text-[#E5C07B] cursor-pointer">
            Support
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-[#A7AFBF]/60 tracking-wider">
          © 2026 TIMEVERA • ALL RIGHTS RESERVED
        </p>
        <p className="font-brand text-xs sm:text-sm text-[#D4AF37] tracking-widest uppercase font-bold">
          PRECISION. LEGACY. FOREVER.
        </p>
      </div>
    </footer>
  );
};

