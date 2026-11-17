import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingCart, Star, Eye, Image as ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setCurrentView, addToCart, toggleWishlist, isWishlisted } = useApp();
  const wishlisted = isWishlisted(product.id);

  const displayPrice = product.discountPrice ?? product.price;

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Visual Asset Showcase Slot */}
      <div
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
        onClick={() => setCurrentView('product-detail', { productId: product.id })}
      >
        {product.previewUrl ? (
          <img
            src={product.previewUrl}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <ImageIcon className="w-8 h-8 mb-1.5" />
            <span className="text-[11px] font-mono uppercase">{product.fileFormats.join(' · ')}</span>
          </div>
        )}

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentView('product-detail', { productId: product.id });
            }}
            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            aria-label="View design specifications"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-xs font-semibold shadow hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            aria-label="Add design to cart"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>

        {/* CorelDraw / Format Callout */}
        {product.fileFormats.includes('CDR') && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px] tracking-wider shadow-sm uppercase">
            CorelDRAW .CDR
          </div>
        )}

        {/* Wishlist Affordance */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            wishlisted
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white shadow-sm'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Content & Metadata Area */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
          <span className="font-medium text-slate-700 truncate">{product.categoryName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 truncate">
            {product.fileFormats.slice(0, 3).join('/')}
          </span>
        </div>

        <h3
          onClick={() => setCurrentView('product-detail', { productId: product.id })}
          className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer mb-1"
          title={product.title}
        >
          {product.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-1 mb-3">
          {product.shortDescription}
        </p>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900 tabular-nums">
              ${displayPrice.toFixed(2)}
            </span>
            {product.discountPrice !== undefined && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {product.reviewsCount > 0 ? (
              <div className="flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                {product.dpi} DPI · {product.colorMode}
              </span>
            )}
            <button
              onClick={() => addToCart(product)}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
              title="Add to cart"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
