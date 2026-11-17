import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { LicenseType } from '../types';
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Heart,
  Star,
  CheckCircle2,
  FileCheck,
  Shield,
  Printer,
  ZoomIn,
  X,
  FileCode2,
  Image as ImageIcon,
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const {
    products,
    adminProducts,
    currentUser,
    selectedProductId,
    setCurrentView,
    addToCart,
    toggleWishlist,
    isWishlisted,
  } = useApp();

  const product =
    products.find((p) => p.id === selectedProductId) ||
    (currentUser?.role === 'admin' ? adminProducts.find((p) => p.id === selectedProductId) : undefined) ||
    products[0];

  const [selectedLicense, setSelectedLicense] = useState<LicenseType>('Commercial');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!product) {
    return (
      <div className="py-20 px-4 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 font-display">No Designs Available Yet</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          New creative designs are coming soon. Check back later.
        </p>
        <button
          onClick={() => setCurrentView('marketplace')}
          className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-semibold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const basePrice = product.discountPrice ?? product.price;
  const currentPrice =
    selectedLicense === 'Extended Commercial' ? Number((basePrice * 2.5).toFixed(2)) : basePrice;

  const activeImageSrc = product.galleryImages[activeImageIndex] || product.previewUrl;
  const packageFiles = (product.files || []).filter((f) => f.includedInPackage);
  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  const handleBuyNow = () => {
    addToCart(product, selectedLicense);
    setCurrentView('checkout');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Draft/Unpublished Banner for Admin Preview */}
      {product.status !== 'published' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>
            <strong>Admin Preview Mode:</strong> This design is currently{' '}
            <span className="uppercase font-bold">{product.status}</span> and is not visible to public buyers.
          </span>
          <button
            onClick={() => setCurrentView('admin-dashboard')}
            className="font-semibold underline"
          >
            Return to My Designs
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => setCurrentView('marketplace')}
          className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Marketplace</span>
        </button>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => setCurrentView('marketplace', { categoryId: product.categoryId })}
          className="hover:text-slate-900 transition-colors"
        >
          {product.categoryName}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Preview Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-sm relative flex items-center justify-center group">
            {activeImageSrc ? (
              <>
                <img
                  src={activeImageSrc}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  onClick={() => setIsZoomOpen(true)}
                  className="w-full h-full object-cover object-center cursor-zoom-in"
                />
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom Preview</span>
                </button>
              </>
            ) : (
              <div className="text-center text-slate-400 p-8">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs font-medium">Preview Image Not Provided</p>
              </div>
            )}

            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-md text-slate-600 hover:text-rose-600 transition-colors"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>
          </div>

          {/* Gallery Thumbnails */}
          {product.galleryImages.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-slate-900 ring-2 ring-slate-900/10'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Gallery preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Highlights Guarantee */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">
                  {product.dpi} DPI {product.colorMode}
                </p>
                <p className="text-[11px] text-slate-500">Print Specifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Original Masters</p>
                <p className="text-[11px] text-slate-500">Preserved Unflattened</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Protected Delivery</p>
                <p className="text-[11px] text-slate-500">Signed Download Token</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
              <span className="font-semibold text-slate-800">{product.categoryName}</span>
              {product.subcategory && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{product.subcategory}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>By {product.designerName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-3 mt-3 text-xs">
              {product.reviewsCount > 0 ? (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900 tabular-nums">{product.rating}</span>
                  <span className="text-slate-400">({product.reviewsCount} reviews)</span>
                </div>
              ) : (
                <span className="text-slate-500">Verified Graphics Expert Release</span>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 tabular-nums font-mono">
                {product.downloadsCount} downloads
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Total Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  ${currentPrice.toFixed(2)}
                </span>
                {product.discountPrice !== undefined && selectedLicense !== 'Extended Commercial' && (
                  <span className="text-sm text-slate-400 line-through tabular-nums font-mono">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              One-Time Purchase
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {/* License Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">Choose License Tier</label>
              <button
                onClick={() => setCurrentView('licenses')}
                className="text-[11px] text-blue-600 hover:underline"
              >
                License Comparisons
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedLicense('Commercial')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedLicense === 'Commercial'
                    ? 'border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Commercial</span>
                  <span className="font-mono font-semibold">${basePrice.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-500">For 1 client or your own business promo</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLicense('Extended Commercial')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedLicense === 'Extended Commercial'
                    ? 'border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Extended</span>
                  <span className="font-mono font-semibold">${(basePrice * 2.5).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-500">Unlimited clients & commercial runs</p>
              </button>
            </div>
          </div>

          {/* Specifications */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Supported Formats:</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {product.fileFormats.map((fmt) => (
                  <span
                    key={fmt}
                    className={`font-semibold ${
                      fmt === 'CDR'
                        ? 'text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 text-[11px]'
                        : 'text-slate-900'
                    }`}
                  >
                    .{fmt}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Software Compatibility:</span>
              <span className="font-semibold text-slate-900 text-right">
                {product.softwareCompatibility.join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Dimensions:</span>
              <span className="font-semibold text-slate-900">{product.dimensions}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Color Profile & DPI:</span>
              <span className="font-semibold text-slate-900">
                {product.colorMode} · {product.dpi} DPI
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Package Size:</span>
              <span className="font-mono font-semibold text-slate-900">{product.fileDownloadSize}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleBuyNow}
              disabled={product.status !== 'published'}
              className="w-full py-3.5 px-4 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Buy Now (${currentPrice.toFixed(2)})</span>
            </button>

            <button
              onClick={() => addToCart(product, selectedLicense)}
              disabled={product.status !== 'published'}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-900 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Shopping Bag</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Information Section */}
      <div className="pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-8">
          {/* Exact Files Included in Package */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display mb-4">
              Files Included in This Design Package ({packageFiles.length})
            </h3>
            {packageFiles.length > 0 ? (
              <div className="space-y-2 text-xs">
                {packageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold shrink-0">
                        .{file.format}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{file.displayName}</p>
                        <p className="text-[11px] text-slate-500">
                          {file.softwareCompatibility} · Version: {file.supportedVersion}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-slate-500 shrink-0">{file.sizeFormatted}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2.5 text-xs text-slate-700">
                {product.whatsIncluded.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display mb-4">
              How to Edit This Template
            </h3>
            <div className="space-y-3">
              {product.howToEdit.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display mb-2">
              Customer Reviews ({product.reviewsCount})
            </h3>
            <p className="text-xs text-slate-500">
              No reviews yet. Verified buyers can leave feedback after downloading this package.
            </p>
          </div>
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4 font-display">
              Protected File Delivery & Compatibility
            </h4>
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-800 mb-1">Are original editable files preserved?</p>
                <p className="text-slate-600">
                  Yes. Your download delivers the exact original .CDR, .AI, .EPS, .PSD, .PSB, .PDF, or .ZIP master files uploaded by Graphics Expert without flattening or quality loss.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">How do I download after purchase?</p>
                <p className="text-slate-600">
                  After checkout confirmation, a signed download token unlocks both the complete ZIP bundle and individual file downloads inside your Customer Dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Designs */}
      {relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 font-display mb-6">
            Related {product.categoryName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Zoom Lightbox Modal */}
      {isZoomOpen && activeImageSrc && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close zoomed preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeImageSrc}
            alt={product.title}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
