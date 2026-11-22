import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppLink } from './AppLink';
import { Search, Menu, X, LogOut, Shield } from 'lucide-react';
import { ViewState } from '../types';

const NAV_LINKS: Array<{ label: string; view: ViewState }> = [
  { label: 'Designs', view: 'marketplace' },
  { label: 'Services', view: 'custom-design' },
  { label: 'Free Tools', view: 'tools' },
  { label: 'About', view: 'about' },
  { label: 'Contact', view: 'contact' },
];

export const Header: React.FC = () => {
  const { currentView, setCurrentView, currentUser, logout, searchQuery, setSearchQuery } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('marketplace');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  const linkClass = (view: ViewState) =>
    `transition-colors whitespace-nowrap relative py-1 hover:text-[#0B1F3A] ${
      currentView === view
        ? 'text-[#0B1F3A] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#17365D]'
        : ''
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <AppLink view="home" className="group flex items-center gap-2.5 whitespace-nowrap shrink-0" aria-label="Graphics Expert home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-8 h-8 rounded-lg shrink-0" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#0B1F3A" />
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
            <span className="font-display font-bold text-lg sm:text-xl tracking-[0.015em] text-[#0B1F3A] group-hover:text-[#17365D] transition-colors">
              GRAPHICS EXPERT
            </span>
          </AppLink>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Main">
            {NAV_LINKS.map((item) => (
              <AppLink key={item.label} view={item.view} className={linkClass(item.view)}>
                {item.label}
              </AppLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative" role="search">
              <label htmlFor="header-search" className="sr-only">
                Search designs
              </label>
              <input
                id="header-search"
                type="search"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-64 pl-8 pr-3 py-2 text-sm rounded-lg bg-slate-100 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#17365D]/40 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Search designs"
            >
              <Search className="w-5 h-5" />
            </button>

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <AppLink
                  view="admin-dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#17365D] hover:bg-[#0B1F3A] rounded-lg transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </AppLink>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="relative" role="search">
              <label htmlFor="header-search-mobile" className="sr-only">
                Search designs
              </label>
              <input
                id="header-search-mobile"
                type="search"
                placeholder="Search designs, formats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 text-base rounded-lg bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#17365D]/40"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </form>
          </div>
        )}

        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-slate-200 py-3 space-y-1" aria-label="Mobile">
            {NAV_LINKS.map((item) => (
              <AppLink
                key={item.label}
                view={item.view}
                onNavigate={() => setIsMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'bg-[#EAF0F8] text-[#0B1F3A] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </AppLink>
            ))}
            {currentUser && (
              <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1 px-1">
                <AppLink
                  view="admin-dashboard"
                  onNavigate={() => setIsMobileMenuOpen(false)}
                  className="block px-2 py-2.5 text-sm font-semibold text-[#0B1F3A]"
                >
                  Admin dashboard
                </AppLink>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-2 py-2.5 text-sm font-medium text-slate-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
