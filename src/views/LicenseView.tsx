import React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';

export const LicenseView: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17365D]">
          Licensing Agreements
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
          Simple, Transparent Digital Licenses
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review rights and permitted usage for our digital design templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Personal License */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">Personal Use</h3>
            <p className="text-slate-500 mt-1">For individual non-commercial events, birthday cards, and personal home projects.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>Personal social media posts</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>Personal birthday/wedding prints</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <X className="w-4 h-4 shrink-0" />
              <span>No business promotion</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <X className="w-4 h-4 shrink-0" />
              <span>No paid client deliverables</span>
            </div>
          </div>
        </div>

        {/* Commercial License */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Standard Market Tier</span>
            <h3 className="text-base font-bold font-display">Commercial Use</h3>
            <p className="text-slate-300 mt-1">For your business marketing or for a single commercial client project.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800 text-slate-200">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>Unlimited business promotional prints</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>One end-client commercial design</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>Paid social advertising campaigns</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400">
              <X className="w-4 h-4 shrink-0" />
              <span>No direct template resale or redistribution</span>
            </div>
          </div>
        </div>

        {/* Extended Commercial License */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">Extended Commercial</h3>
            <p className="text-slate-500 mt-1">For retail merchandise, physical product packaging sold at scale, and unlimited clients.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>Unlimited commercial client projects</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>Items for sale (t-shirts, mugs, packaging)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>National billboard and TV campaigns</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <X className="w-4 h-4 shrink-0" />
              <span>Cannot claim original vector authorship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
