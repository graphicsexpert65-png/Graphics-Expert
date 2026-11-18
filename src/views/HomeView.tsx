import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import {
  UtensilsCrossed,
  Briefcase,
  Share2,
  HeartHandshake,
  FileText,
  Maximize2,
  CreditCard,
  BookOpen,
  Flag,
  Moon,
  PenTool,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Download,
  Printer,
  Upload,
  Plus,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { products, categories, setCurrentView, currentUser } = useApp();

  const featuredProducts = products.filter((p) => p.featured).slice(0, 8);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'PenTool': return <PenTool className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Image': return <ImageIcon className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Receipt': return <Receipt className="w-5 h-5" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'Share2': return <Share2 className="w-5 h-5" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Maximize2': return <Maximize2 className="w-5 h-5" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Flag': return <Flag className="w-5 h-5" />;
      case 'Moon': return <Moon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden pt-10 sm:pt-16 pb-14 bg-[#f3f5f9] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-700 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>GRAPHICS EXPERT · Creative Designs. Professional Tools.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold text-[#0F172A] tracking-[-0.045em] font-display text-balance leading-[1.04] max-w-3xl">
                Design smarter.\nCreate without limits.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-8">
                Discover editable print-ready templates, practical browser tools, and custom graphic design services—all in one creative workspace.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentView('marketplace')}
                  className="px-6 py-3.5 bg-[#0F172A] hover:bg-blue-950 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/15 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentView('tools')}
                  className="px-6 py-3.5 bg-white hover:bg-white text-slate-800 border border-slate-300 rounded-xl text-sm font-bold transition-all shadow-sm hover:-translate-y-0.5"
                >
                  Try Free Tools
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin-dashboard')}
                    className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-xs flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Design</span>
                  </button>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Original Unflattened Source Files</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Protected Signed Downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>CorelDRAW (.CDR), AI, EPS & PSD</span>
                </div>
              </div>
            </div>

            {/* Right Studio Architecture Showcase */}
            <div className="lg:col-span-5 relative z-10">
              <div className="rounded-[1.75rem] bg-[#101b32] text-white border border-slate-700/70 shadow-[0_30px_80px_-25px_rgba(15,23,42,0.55)] p-6 sm:p-7 space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
                      Multi-Format Digital Studio
                    </p>
                    <h2 className="text-lg font-bold font-display mt-0.5">
                      Supported Editable Source Formats
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">300 DPI · CMYK</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                    <span className="font-mono font-bold text-amber-400">.CDR</span>
                    <p className="font-semibold text-white mt-1">CorelDRAW</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Panaflex, Wedding & Visiting Cards</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                    <span className="font-mono font-bold text-orange-400">.AI / .EPS</span>
                    <p className="font-semibold text-white mt-1">Adobe Illustrator</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Scalable Press & Brand Vectors</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                    <span className="font-mono font-bold text-sky-400">.PSD / .PSB</span>
                    <p className="font-semibold text-white mt-1">Adobe Photoshop</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Smart Object Print & Social Kits</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                    <span className="font-mono font-bold text-emerald-400">.PDF / .TIFF / .ZIP</span>
                    <p className="font-semibold text-white mt-1">Print & Bundles</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Multi-format Press Archives</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="text-slate-400">
                    {products.length > 0
                      ? `${products.length} published design${products.length === 1 ? '' : 's'} live`
                      : 'Marketplace ready for original uploads'}
                  </span>
                  <button
                    onClick={() => setCurrentView(currentUser?.role === 'admin' ? 'admin-dashboard' : 'marketplace')}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <span>{currentUser?.role === 'admin' ? 'Open Admin Studio' : 'Browse Store'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'Editable source files', label: 'Keep control of your designs', icon: <Layers className="w-5 h-5" /> },
            { value: 'Print-ready quality', label: 'CMYK, dimensions & 300 DPI', icon: <Printer className="w-5 h-5" /> },
            { value: 'Free browser tools', label: 'Useful utilities, right in your browser', icon: <Sparkles className="w-5 h-5" /> },
          ].map((item) => (
            <div key={item.value} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">{item.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">{item.value}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{item.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">
              Explore Design Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Specialized print press and vector categories crafted for businesses and commercial designers.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Browse All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentView('marketplace', { categoryId: cat.id })}
              className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-[#0F172A] group-hover:text-white transition-colors flex items-center justify-center mb-3">
                {getCategoryIcon(cat.iconName)}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {cat.templateCount} {cat.templateCount === 1 ? 'design' : 'designs'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED DESIGNS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">
              Featured Designs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Original editable graphic design packages published by Graphics Expert.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            {currentUser?.role === 'admin' ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Start Building Your Marketplace
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Upload your first original design to begin selling.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView('admin-dashboard')}
                    className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Design</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  No Designs Available Yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  New creative designs are coming soon. Check back later.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* 4. CORELDRAW SPOTLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-[#0F172A] text-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-amber-500/30 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              CorelDRAW (.CDR) & Print Press Specialists
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Commercial Panaflex, Wedding Cards & Standee Banners in Native CorelDRAW
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Original editable vector files (.CDR, .AI, .EPS) alongside layered Photoshop (.PSD, .PSB) and press-ready PDFs. Preserved untouched for Pakistani and international offset printing houses.
            </p>
          </div>

          <div className="z-10 shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView('marketplace')}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('custom-design')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all border border-white/20 text-center"
            >
              Request Custom Design
            </button>
          </div>
        </div>
      </section>

      {/* 5. FREE TOOLS PROMOTIONAL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F172A] text-white rounded-2xl p-8 lg:p-12 relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                100% Free & In-Browser
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight">
                Resize, Compress, and Convert Images in Seconds.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Zero file uploads to external servers. Use the Graphics Expert image resizer with DPI math, instant JPG/PNG converter, and multi-image PDF compiler directly on your machine.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'resizer' })}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Open Image Resizer
                </button>
                <button
                  onClick={() => setCurrentView('tools', { toolId: 'image-to-pdf' })}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700"
                >
                  Create Multi-Page PDF
                </button>
                <button
                  onClick={() => setCurrentView('tools')}
                  className="px-5 py-2.5 bg-transparent hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  See All Free Tools →
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="font-semibold text-white">Image Resizer</p>
                <p className="text-[11px] text-slate-400 mt-1">Inches, CM, & DPI math</p>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="font-semibold text-white">Lossless Compressor</p>
                <p className="text-[11px] text-slate-400 mt-1">Up to 80% file reduction</p>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="font-semibold text-white">Image to PDF Maker</p>
                <p className="text-[11px] text-slate-400 mt-1">A4, Letter & Margins</p>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="font-semibold text-white">Print Calculator</p>
                <p className="text-[11px] text-slate-400 mt-1">Precise pixel-to-DPI formula</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CUSTOM DESIGN SERVICE CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Custom Graphic Design Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Need Something Unique? We'll Design It for You.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              From bespoke restaurant menus and Panaflex banners to Urdu/English corporate stationery in CorelDRAW, Illustrator, or Photoshop.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('custom-design')}
            className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
          >
            Submit Design Brief
          </button>
        </div>
      </section>
    </div>
  );
};
