import React, { useState } from 'react';
import { Calculator, CheckCircle2, HelpCircle, Printer, Sliders } from 'lucide-react';

export const PrintCalculatorTool: React.FC = () => {
  const [width, setWidth] = useState<number>(5);
  const [height, setHeight] = useState<number>(3);
  const [unit, setUnit] = useState<'inches' | 'cm' | 'mm' | 'pixels'>('inches');
  const [dpi, setDpi] = useState<number>(300);

  // Conversion calculations
  let widthInches = width;
  let heightInches = height;

  if (unit === 'cm') {
    widthInches = width / 2.54;
    heightInches = height / 2.54;
  } else if (unit === 'mm') {
    widthInches = width / 25.4;
    heightInches = height / 25.4;
  } else if (unit === 'pixels') {
    widthInches = width / dpi;
    heightInches = height / dpi;
  }

  const calculatedPxW = Math.round(widthInches * dpi);
  const calculatedPxH = Math.round(heightInches * dpi);
  const megapixels = ((calculatedPxW * calculatedPxH) / 1000000).toFixed(2);

  // Calculate GCD for aspect ratio
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(calculatedPxW, calculatedPxH) || 1;
  const ratioW = calculatedPxW / divisor;
  const ratioH = calculatedPxH / divisor;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Print Size & DPI Calculator</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculate exact pixel specifications required for press-ready flyers, business cards, billboards, and fine art prints.
          </p>
        </div>
        <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 self-start md:self-auto font-medium flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" />
          Commercial Print Standards (CMYK)
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unit of Measurement
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['inches', 'cm', 'mm', 'pixels'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors uppercase ${
                    unit === u
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Width ({unit})
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height ({unit})
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Print Resolution (DPI)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 72, label: '72 (Screen)' },
                { val: 150, label: '150 (Newsprint)' },
                { val: 300, label: '300 (Standard)' },
                { val: 600, label: '600 (Fine Art)' },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDpi(d.val)}
                  className={`py-2 px-2 text-center rounded-lg border transition-colors ${
                    dpi === d.val
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">{d.val}</div>
                  <div className="text-[10px] opacity-80">{d.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Common Print Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Business Card (3.5 × 2 in)', w: 3.5, h: 2, u: 'inches' },
                { name: 'Restaurant Flyer (5 × 3 in)', w: 5, h: 3, u: 'inches' },
                { name: 'US Letter Flyer (8.5 × 11 in)', w: 8.5, h: 11, u: 'inches' },
                { name: 'A4 Flyer (210 × 297 mm)', w: 210, h: 297, u: 'mm' },
                { name: 'Postcard (4 × 6 in)', w: 4, h: 6, u: 'inches' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setWidth(preset.w);
                    setHeight(preset.h);
                    setUnit(preset.u as any);
                    setDpi(300);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className="lg:col-span-6 bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Calculated Canvas Dimensions
            </span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 mb-2">
              {calculatedPxW} × {calculatedPxH} px
            </div>
            <p className="text-xs text-slate-300">
              For a <strong className="text-white">{width} × {height} {unit}</strong> physical output at{' '}
              <strong className="text-white">{dpi} DPI</strong>.
            </p>

            <div className="mt-6 space-y-3 border-t border-slate-800 pt-4 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Megapixels:</span>
                <span className="font-mono font-bold text-white">{megapixels} MP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Aspect Ratio:</span>
                <span className="font-mono font-bold text-white">
                  {(calculatedPxW / calculatedPxH).toFixed(2)}:1 ({ratioW}:{ratioH})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Bleed Requirement (0.125 in / 3mm):</span>
                <span className="font-mono font-bold text-white">
                  +{Math.round(0.25 * dpi)} px total canvas
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-[11px] text-slate-300">
            <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Designer Recommendation:
            </p>
            {dpi >= 300 ? (
              <p>Ready for offset lithography or digital press. Razor sharp text and vector graphics.</p>
            ) : (
              <p>Suitable for large format banners or digital displays viewed from 3+ feet away.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
