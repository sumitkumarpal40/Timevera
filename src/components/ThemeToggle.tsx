import React, { useState } from 'react';
import { Sun, Moon, Smartphone, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Toggle button showing current theme */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 text-[#A7AFBF] hover:text-[#F8FAFC] hover:bg-[#1A1E2B] rounded-lg border border-[#252A36] transition-colors flex items-center gap-1.5 cursor-pointer"
        title="Theme (Obsidian Black / Warm Gold / System)"
        aria-label="Theme Switcher"
      >
        {theme === 'light' && <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />}
        {theme === 'dark' && <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />}
        {theme === 'system' && <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5C07B]" />}
        <span className="text-[10px] sm:text-[11px] font-semibold hidden md:inline capitalize">
          {theme === 'light' ? 'Light' : theme === 'dark' ? 'Obsidian' : 'Auto'}
        </span>
      </button>

      {/* Theme Options Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 bg-[#131620] border border-[#252A36] rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#A7AFBF] tracking-wider border-b border-[#252A36]">
              Select Theme
            </div>

            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#1A1E2B] transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/10'
                  : 'text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Light Ivory</span>
              </div>
              {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#1A1E2B] transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/10'
                  : 'text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Obsidian Luxury</span>
              </div>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </button>

            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#1A1E2B] transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/10'
                  : 'text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#E5C07B]" />
                <span>Match Device</span>
              </div>
              {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
