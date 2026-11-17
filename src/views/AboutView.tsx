import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Wrench, Sparkles, Palette, ShieldCheck } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          About Graphics Expert
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
          Creative Designs. Professional Tools.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Graphics Expert is a digital design marketplace and creative tools platform combining original editable CorelDRAW (.CDR), Illustrator (.AI/.EPS), and Photoshop (.PSD/.PSB) packages with in-browser utilities and custom design services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
          <h3 className="font-bold text-slate-900 text-sm">Ready-Made Templates</h3>
          <p className="text-slate-500 leading-relaxed">
            Instant editable Photoshop, Illustrator, and Canva assets built to commercial 300 DPI CMYK standards.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">2</div>
          <h3 className="font-bold text-slate-900 text-sm">Free Browser Utilities</h3>
          <p className="text-slate-500 leading-relaxed">
            Hardware-accelerated image resizers, compressors, and PDF compilers that execute locally without cloud uploads.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">3</div>
          <h3 className="font-bold text-slate-900 text-sm">Bespoke Services</h3>
          <p className="text-slate-500 leading-relaxed">
            Professional graphic design studio offering direct custom briefs for local Pakistani businesses and global clients.
          </p>
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm font-display">Our Standards</h3>
        <p className="text-slate-600 leading-relaxed">
          Every design published on Graphics Expert is preserved in its original editable vector or layered format and verified for print bleed, resolution, and commercial clarity.
        </p>
      </div>
    </div>
  );
};
