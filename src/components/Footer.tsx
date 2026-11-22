import React from 'react';
import { useApp } from '../context/AppContext';
import { AppLink } from './AppLink';
import { ShieldCheck, Mail } from 'lucide-react';

const linkClass = 'hover:text-white transition-colors';

export const Footer: React.FC = () => {
  const { categories } = useApp();
  const topCategories = categories.slice(0, 6);

  return (
    <footer className="bg-[#0B1F3A] text-slate-300 text-sm border-t border-[#17365D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2">
            <AppLink view="home" className="flex items-center gap-2.5 mb-3 w-fit" aria-label="Graphics Expert home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-8 h-8 rounded-lg shrink-0" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="#17365D" />
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
              <span className="font-display font-extrabold text-lg text-white tracking-tight">GRAPHICS EXPERT</span>
            </AppLink>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-4">
              Original CorelDRAW, Adobe Illustrator and Photoshop design files, free browser design tools, and custom
              graphic design for logos, banners, cards and print.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-300" />
                Original source files
              </span>
              <a href="mailto:graphicsexpert65@gmail.com" className="flex items-center gap-1.5 hover:text-white">
                <Mail className="w-4 h-4 text-sky-300" />
                graphicsexpert65@gmail.com
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Design Categories</h2>
            <ul className="space-y-2">
              <li>
                <AppLink view="marketplace" className={linkClass}>
                  All Designs
                </AppLink>
              </li>
              {topCategories.map((c) => (
                <li key={c.id}>
                  <AppLink view="marketplace" categoryId={c.id} className={linkClass}>
                    {c.name}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Free Tools</h2>
            <ul className="space-y-2">
              {[
                ['resizer', 'Image Resizer'],
                ['compressor', 'Image Compressor'],
                ['jpg-to-png', 'JPG ⇄ PNG Converter'],
                ['image-to-pdf', 'Image to PDF'],
                ['print-calculator', 'Print Size Calculator'],
                ['social-generator', 'Social Media Sizes'],
              ].map(([id, label]) => (
                <li key={id}>
                  <AppLink view="tools" toolId={id} className={linkClass}>
                    {label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Company</h2>
            <ul className="space-y-2">
              <li>
                <AppLink view="about" className={linkClass}>
                  About
                </AppLink>
              </li>
              <li>
                <AppLink view="custom-design" className={linkClass}>
                  Design Services
                </AppLink>
              </li>
              <li>
                <AppLink view="faq" className={linkClass}>
                  FAQ
                </AppLink>
              </li>
              <li>
                <AppLink view="licenses" className={linkClass}>
                  Licenses
                </AppLink>
              </li>
              <li>
                <AppLink view="contact" className={linkClass}>
                  Contact
                </AppLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#17365D] flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Graphics Expert. All rights reserved.</p>
          <p className="text-xs text-slate-400">Designs, services and free tools for printers, shops and creators.</p>
        </div>
      </div>
    </footer>
  );
};
