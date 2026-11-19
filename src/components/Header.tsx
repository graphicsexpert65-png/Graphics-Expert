import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Sliders,
  Shield,
  Layers,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    cart,
    wishlist,
    currentUser,
    logout,
    openAuthModal,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const cartItemCount = cart.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentView('marketplace');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'Templates', view: 'marketplace' as const },
    { label: 'Free Tools', view: 'tools' as const },
    { label: 'Custom Design', view: 'custom-design' as const },
    { label: 'Pricing', view: 'pricing' as const },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark (Strict single-element contract) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setCurrentView('home')}
              className="text-left group flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="w-8 h-8 rounded-lg shadow-sm shrink-0"
                aria-hidden="true"
              >
                <rect width="64" height="64" rx="14" fill="#0F172A" />
                <path
                  d="M42 22H26a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h12a6 6 0 0 0 6-6v-4H32"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="46" cy="18" r="4.5" fill="#FFFFFF" />
              </svg>
              <span className="font-display font-bold text-lg sm:text-xl tracking-[0.015em] text-[#142B4A] group-hover:text-[#27496F] transition-colors whitespace-nowrap">
                GRAPHICS EXPERT
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean text with hover states) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => setCurrentView(item.view)}
                className={`transition-colors whitespace-nowrap hover:text-[#0F172A] relative py-1 ${
                  currentView === item.view
                    ? 'text-[#0F172A] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0F172A]'
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Search, Cart & Account Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search templates & tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <button
              onClick={() => {
                if (currentUser) {
                  setCurrentView('dashboard');
                } else {
                  openAuthModal('login');
                }
              }}
              className="hidden sm:flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative"
              title="My Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCurrentView('cart')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-slate-800"
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-semibold tabular-nums text-slate-900">
                {cartItemCount}
              </span>
            </button>

            {/* User Account / Auth Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  <span className="hidden sm:block text-xs font-medium text-slate-800 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-slate-500 truncate text-[11px]">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider uppercase text-blue-600">
                        {currentUser.role} Account
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentView('dashboard');
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Customer Dashboard & Downloads
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setCurrentView('admin-dashboard');
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-800 hover:bg-slate-100 flex items-center gap-2 font-medium"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Operations Center
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search templates, formats & tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 space-y-1">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setCurrentView(item.view);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'bg-slate-100 text-[#0F172A] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 px-3">
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-sm font-medium text-slate-700"
                  >
                    Customer Dashboard
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentView('admin-dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-sm font-medium text-slate-800"
                    >
                      Admin Operations
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-sm font-medium text-rose-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      openAuthModal('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 text-center text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal('signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 text-center text-xs font-semibold text-white bg-slate-900 rounded-lg"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
