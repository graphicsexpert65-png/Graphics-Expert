import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Search, X, RotateCcw, Filter, Layers, Plus } from 'lucide-react';
import { FileFormat } from '../types';

export const MarketplaceView: React.FC = () => {
  const {
    products,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    setCurrentView,
    currentUser,
  } = useApp();

  const [priceRange, setPriceRange] = useState<'all' | 'under5' | '5to10' | 'over10'>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-low' | 'price-high'>('newest');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategoryId && selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
          return false;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(query);
          const matchesCategory = p.categoryName.toLowerCase().includes(query);
          const matchesSub = (p.subcategory || '').toLowerCase().includes(query);
          const matchesTags = p.tags.some((t) => t.toLowerCase().includes(query));
          const matchesFormat = p.fileFormats.some((f) => f.toLowerCase().includes(query));
          if (!matchesTitle && !matchesCategory && !matchesSub && !matchesTags && !matchesFormat) {
            return false;
          }
        }

        const price = p.discountPrice ?? p.price;
        if (priceRange === 'under5' && price >= 5) return false;
        if (priceRange === '5to10' && (price < 5 || price > 10)) return false;
        if (priceRange === 'over10' && price <= 10) return false;

        if (selectedFormat !== 'all' && !p.fileFormats.includes(selectedFormat as FileFormat)) {
          return false;
        }

        if (selectedLicense !== 'all' && p.license !== selectedLicense) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price;
        const priceB = b.discountPrice ?? b.price;

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, selectedCategoryId, searchQuery, priceRange, selectedFormat, selectedLicense, sortBy]);

  const resetFilters = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    setPriceRange('all');
    setSelectedFormat('all');
    setSelectedLicense('all');
    setSortBy('newest');
  };

  const formats: FileFormat[] = [
    'CDR',
    'AI',
    'EPS',
    'PSD',
    'PSB',
    'PDF',
    'PNG',
    'JPG',
    'TIF',
    'ZIP',
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            Graphics Expert Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {products.length > 0
              ? `Browse ${products.length} published original graphic design packages (.CDR, .AI, .EPS, .PSD, .PDF, .ZIP).`
              : 'Original editable commercial templates crafted by Graphics Expert.'}
          </p>
        </div>

        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search designs, CDR, AI, PSD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filter Designs
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#17365D] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Category</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2 text-xs">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex justify-between ${
                  !selectedCategoryId
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All Categories</span>
                <span className="tabular-nums opacity-75">{products.length}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex justify-between ${
                    selectedCategoryId === c.id
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums opacity-75">{c.templateCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Format Filter */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">File Format</h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-2.5 py-1 text-xs rounded-md border ${
                  selectedFormat === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 text-xs rounded-md border ${
                    selectedFormat === fmt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : fmt === 'CDR'
                      ? 'bg-[#EAF0F8] text-[#0B1F3A] border-[#9FB4CF] hover:bg-[#DCE6F3] font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {fmt === 'CDR' ? 'CorelDRAW (.CDR)' : `.${fmt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Price Range</h4>
            <div className="space-y-1 text-xs">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under5', label: 'Under $5.00' },
                { id: '5to10', label: '$5.00 to $10.00' },
                { id: 'over10', label: '$10.00 & Above' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriceRange(p.id as 'all' | 'under5' | '5to10' | 'over10')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                    priceRange === p.id
                      ? 'bg-slate-100 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* License Filter */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">License Type</h4>
            <div className="space-y-1 text-xs">
              {[
                { id: 'all', label: 'All Licenses' },
                { id: 'Personal', label: 'Personal Use' },
                { id: 'Commercial', label: 'Commercial Use' },
                { id: 'Extended Commercial', label: 'Extended Commercial' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLicense(l.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                    selectedLicense === l.id
                      ? 'bg-slate-100 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <div className="lg:col-span-9 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className="lg:hidden px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 font-medium flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
              <span className="text-slate-500">
                Showing <strong className="text-slate-900 tabular-nums">{filteredProducts.length}</strong> designs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'price-low' | 'price-high')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none"
              >
                <option value="newest">Newest Releases</option>
                <option value="popular">Most Downloaded</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Mobile Drawer */}
          {isFilterDrawerOpen && (
            <div className="lg:hidden p-4 bg-white rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Filter Options</span>
                <button onClick={resetFilters} className="text-[#17365D] font-medium">
                  Reset
                </button>
              </div>
              <div>
                <span className="font-semibold block mb-1">Category</span>
                <select
                  value={selectedCategoryId || 'all'}
                  onChange={(e) => setSelectedCategoryId(e.target.value === 'all' ? null : e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="font-semibold block mb-1">File Format</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="all">All Formats</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Product Grid OR Empty State */}
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <Layers className="w-7 h-7" />
              </div>
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
                      className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
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
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No designs matched your filters
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Try searching for a different keyword or resetting your category, format, and price filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
