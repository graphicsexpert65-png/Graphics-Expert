import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { AppLink } from '../components/AppLink';
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
  Search,
  Printer,
  Package,
  Palette,
  FileCode2,
  Wrench,
  Mail,
  Inbox,
} from 'lucide-react';

const SERVICES = [
  { title: 'Logo design', icon: <PenTool className="w-5 h-5" /> },
  { title: 'Business cards', icon: <CreditCard className="w-5 h-5" /> },
  { title: 'Banner & panaflex', icon: <Flag className="w-5 h-5" /> },
  { title: 'Social media designs', icon: <Share2 className="w-5 h-5" /> },
  { title: 'Printing designs', icon: <Printer className="w-5 h-5" /> },
  { title: 'Packaging design', icon: <Package className="w-5 h-5" /> },
  { title: 'General graphic design', icon: <Palette className="w-5 h-5" /> },
];

const REASONS = [
  {
    title: 'Editable source files',
    text: 'Designs come as original CorelDRAW, Illustrator and Photoshop files, not flattened images.',
    icon: <FileCode2 className="w-5 h-5" />,
  },
  {
    title: 'Made for print',
    text: 'Layouts are built around real print sizes, so they are ready for the press shop.',
    icon: <Printer className="w-5 h-5" />,
  },
  {
    title: 'Free browser tools',
    text: 'Resize, compress and convert images in your browser. Your files are never uploaded.',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    title: 'Custom work on request',
    text: 'Need something specific? Send a brief and get a quote directly from the designer.',
    icon: <Mail className="w-5 h-5" />,
  },
];

export const HomeView: React.FC = () => {
  const { products, categories, setCurrentView, setSearchQuery, isLoadingProducts, productsError } = useApp();
  const [query, setQuery] = useState('');

  const featuredProducts = useMemo(() => products.filter((p) => p.featured).slice(0, 8), [products]);
  const latestProducts = useMemo(
    () => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [products]
  );
  const popularCategories = useMemo(
    () => [...categories].sort((a, b) => b.templateCount - a.templateCount).slice(0, 8),
    [categories]
  );

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query.trim());
    setCurrentView('marketplace');
  };

  const sectionHeader = (title: string, subtitle: string, linkLabel: string, onClick: () => void) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] font-display tracking-tight">{title}</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{subtitle}</p>
      </div>
      <button
        onClick={onClick}
        className="text-sm font-semibold text-[#17365D] hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
      >
        <span>{linkLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const wrap = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <div className="space-y-14 lg:space-y-20 pb-16">
      {/* 1. HERO + 2. INTRODUCTION + 3. SEARCH */}
      <section className="bg-[#0B1F3A] text-white">
        <div className={`${wrap} py-14 sm:py-20`}>
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              Graphics Expert · Graphic design resources &amp; services
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] text-balance">
              Editable design files and custom graphic design
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-8 max-w-2xl">
              Download original CorelDRAW, Illustrator and Photoshop designs for cards, banners, menus and flyers, use
              free browser tools, or order a custom design made for your business.
            </p>

            <form onSubmit={handleSearch} role="search" className="flex flex-col sm:flex-row gap-3 max-w-2xl pt-2">
              <label htmlFor="home-search" className="sr-only">
                Search designs
              </label>
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="home-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search designs, e.g. wedding card, menu, banner"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-500 text-base focus:outline-none focus:ring-4 focus:ring-sky-300/40"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-white text-[#0B1F3A] font-bold hover:bg-slate-100 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentView('marketplace')}
                className="px-6 py-3 border border-white/40 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <span>Browse marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('custom-design')}
                className="px-6 py-3 border border-white/40 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Order a custom design
              </button>
              <button
                onClick={() => setCurrentView('tools')}
                className="px-2 py-3 text-sky-200 hover:text-white text-sm font-semibold underline-offset-4 hover:underline"
              >
                Free tools
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POPULAR CATEGORIES */}
      <section className={wrap} aria-labelledby="home-categories">
        {sectionHeader(
          'Popular design categories',
          'Find the right starting point for your print or digital project.',
          'All designs',
          () => setCurrentView('marketplace')
        )}
        <h2 id="home-categories" className="sr-only">
          Design categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {popularCategories.map((cat) => (
            <AppLink
              key={cat.id}
              view="marketplace"
              categoryId={cat.id}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#17365D] hover:shadow-md transition-all group flex items-center gap-3"
            >
              <span className="w-10 h-10 shrink-0 rounded-lg bg-[#EAF0F8] text-[#17365D] group-hover:bg-[#17365D] group-hover:text-white transition-colors flex items-center justify-center">
                {getCategoryIcon(cat.iconName)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#0B1F3A] line-clamp-1">{cat.name}</span>
                <span className="block text-xs text-slate-500 tabular-nums">
                  {cat.templateCount} {cat.templateCount === 1 ? 'design' : 'designs'}
                </span>
              </span>
            </AppLink>
          ))}
        </div>
      </section>

      {/* 5. FEATURED DESIGNS */}
      {featuredProducts.length > 0 && (
        <section className={wrap}>
          {sectionHeader(
            'Featured designs',
            'Hand-picked editable designs from Graphics Expert.',
            'View marketplace',
            () => setCurrentView('marketplace')
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. LATEST UPLOADS */}
      <section className={wrap}>
        {sectionHeader(
          'Latest uploads',
          'The newest designs added to the marketplace.',
          'See all designs',
          () => setCurrentView('marketplace')
        )}
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#EAF0F8] text-[#17365D] mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            {isLoadingProducts ? (
              <p className="text-sm text-slate-600">Loading designs…</p>
            ) : productsError ? (
              <p role="alert" className="text-sm text-red-700">
                {productsError}
              </p>
            ) : (
              <>
                <h3 className="font-bold text-[#0B1F3A] font-display">New designs are on the way</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  No designs are published yet. In the meantime you can use the free tools or send a brief for a custom
                  design.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* 7. GRAPHIC DESIGN SERVICES */}
      <section className="bg-[#EAF0F8] py-14" aria-labelledby="home-services">
        <div className={wrap}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 id="home-services" className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] font-display tracking-tight">
                Graphic design services
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Custom artwork for your business, prepared for print and screen.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('custom-design')}
              className="text-sm font-semibold text-[#17365D] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {SERVICES.map((service) => (
              <AppLink
                key={service.title}
                view="custom-design"
                className="p-4 bg-white rounded-xl border border-[#C7D4E5] hover:border-[#17365D] hover:shadow-md transition-all flex items-center gap-3"
              >
                <span className="w-10 h-10 shrink-0 rounded-lg bg-[#EAF0F8] text-[#17365D] flex items-center justify-center">
                  {service.icon}
                </span>
                <span className="text-sm font-semibold text-[#0B1F3A]">{service.title}</span>
              </AppLink>
            ))}
          </div>
        </div>
      </section>

      {/* 8. WHY CHOOSE GRAPHICS EXPERT */}
      <section className={wrap} aria-labelledby="home-why">
        <h2 id="home-why" className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] font-display tracking-tight mb-6">
          Why choose Graphics Expert
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
              <span className="w-10 h-10 rounded-xl bg-[#17365D] text-white flex items-center justify-center">
                {reason.icon}
              </span>
              <h3 className="font-bold text-[#0B1F3A] font-display">{reason.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{reason.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. CALL TO ACTION */}
      <section className={wrap}>
        <div className="bg-[#0B1F3A] rounded-3xl px-6 py-10 sm:px-12 sm:py-14 text-center text-white space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-display">Ready to start your next design project?</h2>
          <p className="text-slate-200 max-w-xl mx-auto">
            Browse ready-made editable designs, or tell us what you need and get a quote for a custom design.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentView('marketplace')}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#0B1F3A] rounded-xl font-bold transition-colors"
            >
              Browse designs
            </button>
            <button
              onClick={() => setCurrentView('custom-design')}
              className="px-6 py-3 border border-white/40 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors"
            >
              Send a design brief
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
