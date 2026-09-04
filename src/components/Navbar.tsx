import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  Menu,
  X,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  HelpCircle,
  Phone,
  User,
  LogIn,
  Heart,
} from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';
import { ThemeToggle } from './ThemeToggle';
import { TimeveraLogo } from './TimeveraLogo';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSelectCategory: (cat: string) => void;
  onOpenInstallApp: () => void;
  onOpenWishlist?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  searchTerm,
  onSearchChange,
  onSelectCategory,
  onOpenInstallApp,
  onOpenWishlist,
}) => {
  const { customer, isLoggedIn, openLoginModal, openAccountModal, wishlist } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const handleNavClick = (anchor: string, category?: string) => {
    if (category) {
      onSelectCategory(category);
    }
    setMobileMenuOpen(false);
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#252A36] transition-colors shadow-lg shadow-black/40">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-[#131620] py-1.5 px-4 text-center text-xs text-[#A7AFBF] font-medium flex items-center justify-center gap-3 border-b border-[#252A36] flex-wrap">
        <span className="text-[#A7AFBF]">Pan-India Express Delivery & COD Available</span>
        <span className="hidden sm:inline text-[#252A36]">•</span>
        <span className="hidden sm:inline text-[#A7AFBF]">100% Quality Inspected & Direct Dispatch</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* ⭐ OFFICIAL TIMEVERA GOLD & OBSIDIAN EMBLEM LOGO ⭐ */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="group focus:outline-none flex-shrink-0 cursor-pointer"
          title="Timevera Watch - Home"
        >
          <TimeveraLogo size="md" variant="gold" showTagline={true} />
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => handleNavClick('home')}
            className="text-[#A7AFBF] hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className="text-[#A7AFBF] hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
          >
            Collections
          </button>
          <button
            onClick={() => handleNavClick('shop')}
            className="text-[#A7AFBF] hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
          >
            Shop All
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="text-[#A7AFBF] hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
          >
            About Us
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="text-[#A7AFBF] hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* ⭐ CUSTOMER LOGIN / ACCOUNT BUTTON ⭐ */}
          {isLoggedIn ? (
            <button
              onClick={() => openAccountModal('orders')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#131620] hover:bg-[#1A1E2B] text-[#E5C07B] text-xs font-semibold rounded-lg border border-[#D4AF37]/35 shadow-sm transition-all cursor-pointer"
              title="Customer Account & Orders"
            >
              <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E5C07B] text-[10px] font-bold flex items-center justify-center">
                {customer?.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline truncate max-w-[90px]">
                {customer?.fullName?.split(' ')[0] || 'My Account'}
              </span>
              <span className="sm:hidden">Account</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#131620] hover:bg-[#1A1E2B] text-[#F8FAFC] text-xs font-semibold rounded-lg border border-[#252A36] shadow-sm transition-all cursor-pointer"
              title="Customer Login"
            >
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

          {/* Install App Button */}
          <button
            onClick={onOpenInstallApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#131620] hover:bg-[#1A1E2B] border border-[#252A36] text-[#A7AFBF] hover:text-[#F8FAFC] text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Install Timevera Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>App</span>
          </button>

          {/* Search Toggle */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-[#131620] border border-[#252A36] rounded-lg px-2.5 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-[#D4AF37] mr-1" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-[#F8FAFC] focus:outline-none w-24 sm:w-36 text-xs placeholder-[#A7AFBF]/50"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    onSearchChange('');
                  }}
                  className="text-[#A7AFBF] hover:text-[#F8FAFC] ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-1.5 sm:p-2 text-[#A7AFBF] hover:text-[#D4AF37] hover:bg-[#131620] rounded-lg transition-colors cursor-pointer"
                title="Search products"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={() => {
              if (onOpenWishlist) onOpenWishlist();
              else openAccountModal('wishlist');
            }}
            className="relative p-1.5 sm:p-2 text-[#A7AFBF] hover:text-[#D4AF37] hover:bg-[#131620] rounded-lg transition-colors flex items-center cursor-pointer"
            title="View Wishlist"
          >
            <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${wishlist.length > 0 ? 'text-[#D4AF37] fill-[#D4AF37]' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0B0C10] font-black text-[9px] sm:text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Bag Button */}
          <button
            onClick={onOpenCart}
            className="relative p-1.5 sm:p-2 text-[#A7AFBF] hover:text-[#D4AF37] hover:bg-[#131620] rounded-lg transition-colors flex items-center cursor-pointer"
            title="View Selected Bag"
          >
            <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0B0C10] font-black text-[9px] sm:text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile 3-Lines Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle-btn"
            className="md:hidden p-1.5 sm:p-2 text-[#A7AFBF] hover:text-[#D4AF37] bg-[#131620] rounded-lg border border-[#252A36] ml-1 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#D4AF37]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0C10] border-b border-[#252A36] px-5 py-4 space-y-3 animate-fadeIn shadow-2xl">
          {/* Top Logo inside Drawer */}
          <div className="py-2 border-b border-[#252A36] flex justify-center">
            <TimeveraLogo size="md" variant="gold" />
          </div>

          {/* ⭐ PROMINENT CUSTOMER ACCOUNT / LOGIN IN MOBILE MENU ⭐ */}
          {isLoggedIn ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAccountModal('orders');
              }}
              className="w-full py-3 px-4 bg-[#131620] border border-[#D4AF37]/35 text-[#E5C07B] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>My Account: {customer?.fullName || 'Customer'}</span>
              </div>
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#E5C07B] px-2 py-0.5 rounded font-mono">
                {customer?.phone ? `+91 ${customer.phone}` : 'Profile'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openLoginModal();
              }}
              className="w-full py-3 px-4 bg-[#131620] text-[#F8FAFC] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#252A36]"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" />
              <span>Customer Login / Sign Up</span>
            </button>
          )}

          {/* Install App Button in mobile drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenInstallApp();
            }}
            className="w-full py-2.5 px-4 bg-[#131620] text-[#A7AFBF] font-semibold text-xs uppercase tracking-wider rounded-lg border border-[#252A36] flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-[#D4AF37]" />
            <span>Install Timevera App</span>
          </button>

          <div className="flex flex-col space-y-1 text-sm pt-1">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left text-[#F8FAFC] hover:text-[#D4AF37] py-2 border-b border-[#252A36]/60 font-medium"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className="text-left text-[#F8FAFC] hover:text-[#D4AF37] py-2 border-b border-[#252A36]/60 font-medium"
            >
              Collections
            </button>
            <button
              onClick={() => handleNavClick('shop')}
              className="text-left text-[#F8FAFC] hover:text-[#D4AF37] py-2 border-b border-[#252A36]/60 font-medium"
            >
              Shop All
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-left text-[#F8FAFC] hover:text-[#D4AF37] py-2 border-b border-[#252A36]/60 font-medium"
            >
              About Timevera
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left text-[#F8FAFC] hover:text-[#D4AF37] py-2 border-b border-[#252A36]/60 font-medium"
            >
              Contact Us
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('contact');
              }}
              className="w-full py-2.5 bg-[#131620] hover:bg-[#1A1E2B] text-[#E5C07B] border border-[#D4AF37]/35 font-bold text-center text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Raise Support Ticket / Helpdesk</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};


