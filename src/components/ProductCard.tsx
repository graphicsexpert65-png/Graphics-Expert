import React from 'react';
import { Product } from '../types';
import { AppLink } from './AppLink';
import { Image as ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isFree = product.price === 0;
  const displayPrice = product.discountPrice ?? product.price;

  return (
    <article className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      <AppLink
        view="product-detail"
        productId={product.id}
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center"
        aria-label={`View ${product.title}`}
      >
        {product.previewUrl ? (
          <img
            src={product.previewUrl}
            alt={`${product.title} — ${product.categoryName} design preview`}
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <ImageIcon className="w-8 h-8 mb-1.5" />
            <span className="text-xs font-mono uppercase">{product.fileFormats.join(' · ')}</span>
          </div>
        )}

        {product.fileFormats.includes('CDR') && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0B1F3A] text-white font-bold text-[10px] tracking-wider shadow-sm uppercase">
            CorelDRAW .CDR
          </span>
        )}
        {isFree && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white text-[#0B1F3A] font-bold text-[10px] tracking-wider shadow-sm uppercase">
            Free
          </span>
        )}
      </AppLink>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
          <span className="font-medium text-slate-700 truncate">{product.categoryName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 truncate">
            {product.fileFormats.slice(0, 3).join('/')}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-[#0B1F3A] mb-1 line-clamp-1" title={product.title}>
          <AppLink view="product-detail" productId={product.id} className="hover:text-[#17365D] hover:underline">
            {product.title}
          </AppLink>
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.shortDescription}</p>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          {isFree ? (
            <span className="text-base font-bold text-[#0B1F3A]">Free download</span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#0B1F3A] tabular-nums">${displayPrice.toFixed(2)}</span>
              {product.discountPrice !== undefined && (
                <span className="text-xs text-slate-400 line-through tabular-nums">${product.price.toFixed(2)}</span>
              )}
            </div>
          )}
          <span className="text-[11px] text-slate-500 font-mono">
            {product.dpi} DPI · {product.colorMode}
          </span>
        </div>
      </div>
    </article>
  );
};
