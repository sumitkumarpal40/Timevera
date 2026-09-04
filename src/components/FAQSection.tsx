import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQS_DATA } from '../data/watches';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#252A36]">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#131620] border border-[#D4AF37]/30 text-[#E5C07B] text-xs font-semibold tracking-widest uppercase mb-2 rounded-md">
          <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Ordering Guide</span>
        </div>
        <h2 className="font-brand text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-[#A7AFBF] text-sm">
          Everything you need to know about purchasing with Timevera Watch
        </p>
      </div>

      <div className="space-y-3">
        {FAQS_DATA.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="bg-[#131620] border border-[#252A36] rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-[#F8FAFC] font-medium text-sm sm:text-base hover:text-[#E5C07B] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#A7AFBF] flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#A7AFBF] leading-relaxed border-t border-[#252A36] pt-3">
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
