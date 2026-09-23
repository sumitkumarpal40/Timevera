import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQS_DATA } from '../data/watches';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#252A36]">
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#131620] border border-[#D4AF37]/30 text-[#E5C07B] text-xs font-semibold tracking-widest uppercase mb-2 rounded-md">
          <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Ordering Guide</span>
        </div>
        <h2 className="font-brand text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#F8FAFC] mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-[#A7AFBF] text-xs sm:text-sm">
          Everything you need to know about purchasing with Timevera Watch
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {FAQS_DATA.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="bg-[#131620] border border-[#252A36] rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-3 sm:p-4 text-left flex items-center justify-between text-[#F8FAFC] font-medium text-xs sm:text-sm md:text-base hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#A7AFBF] flex-shrink-0 ml-2" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 sm:px-4 pb-3.5 sm:pb-4 pt-2.5 sm:pt-3 text-xs sm:text-sm text-[#A7AFBF] leading-relaxed border-t border-[#252A36]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
