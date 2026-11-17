import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Download } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <footer className="bg-[#0B1120] text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-2">
            <button
              onClick={() => setCurrentView('home')}
              className="text-left flex items-center gap-2.5 group mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="w-8 h-8 rounded-lg shrink-0"
                aria-hidden="true"
              >
                <rect width="64" height="64" rx="14" fill="#1E293B" />
                <path
                  d="M42 22H26a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h12a6 6 0 0 0 6-6v-4H32"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="46" cy="18" r="4.5" fill="#F59E0B" />
              </svg>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                GRAPHICS EXPERT
              </span>
            </button>
            <p className="text-slate-200 text-sm font-medium mb-3">
              "Creative Designs. Professional Tools."
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
              Original CorelDRAW, Adobe Illustrator, Photoshop & print-ready design templates, free browser utilities, and custom graphic design services for businesses and creators.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Original Source Files
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Protected Digital Delivery
              </span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Design Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: '' })}
                  className="hover:text-white transition-colors"
                >
                  All Designs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: 'coreldraw-designs' })}
                  className="hover:text-white transition-colors"
                >
                  CorelDRAW Designs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: 'panaflex-flex-banners' })}
                  className="hover:text-white transition-colors"
                >
                  Panaflex & Flex Banners
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: 'wedding-nikkah-cards' })}
                  className="hover:text-white transition-colors"
                >
                  Wedding & Nikkah Cards
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: 'restaurant-menus' })}
                  className="hover:text-white transition-colors"
                >
                  Restaurant Menus
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('marketplace', { categoryId: 'business-cards' })}
                  className="hover:text-white transition-colors"
                >
                  Business Cards
                </button>
              </li>
            </ul>
          </div>

          {/* Free Tools */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Free Online Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'resizer' })}
                  className="hover:text-white transition-colors"
                >
                  Image Resizer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'compressor' })}
                  className="hover:text-white transition-colors"
                >
                  Image Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'jpg-to-png' })}
                  className="hover:text-white transition-colors"
                >
                  JPG to PNG / PNG to JPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'image-to-pdf' })}
                  className="hover:text-white transition-colors"
                >
                  Image to PDF Maker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'print-calculator' })}
                  className="hover:text-white transition-colors"
                >
                  Print Size Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'social-generator' })}
                  className="hover:text-white transition-colors"
                >
                  Social Media Resizer
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Company & Help
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('about')}
                  className="hover:text-white transition-colors"
                >
                  About Graphics Expert
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('custom-design')}
                  className="hover:text-white transition-colors"
                >
                  Custom Design Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="hover:text-white transition-colors"
                >
                  Membership Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('faq')}
                  className="hover:text-white transition-colors"
                >
                  Help & FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('licenses')}
                  className="hover:text-white transition-colors"
                >
                  License Agreements
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            © 2026 Graphics Expert. All rights reserved. Creative Designs. Professional Tools.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setCurrentView('licenses')} className="hover:text-slate-300">
              Personal & Commercial Licenses
            </button>
            <span>·</span>
            <button onClick={() => setCurrentView('faq')} className="hover:text-slate-300">
              Refund Policy
            </button>
            <span>·</span>
            <button onClick={() => setCurrentView('contact')} className="hover:text-slate-300">
              graphicsexpert65@gmail.com
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
