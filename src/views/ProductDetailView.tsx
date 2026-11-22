import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { AppLink } from '../components/AppLink';
import { ArrowLeft, Download, Printer, FileCheck, ZoomIn, X, Mail, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const { products, adminProducts, currentUser, selectedProductId, isLoadingProducts, downloadFreeFile, downloadAdminFile } =
    useApp();

  const product =
    products.find((p) => p.id === selectedProductId || p.slug === selectedProductId) ||
    (currentUser?.role === 'admin'
      ? adminProducts.find((p) => p.id === selectedProductId || p.slug === selectedProductId)
      : undefined);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="py-20 px-4 max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#0B1F3A] font-display">
          {isLoadingProducts ? 'Loading design…' : 'Design not found'}
        </h1>
        {!isLoadingProducts && (
          <>
            <p className="text-slate-600">This design may have been removed or is not published.</p>
            <AppLink view="marketplace" className="inline-block px-5 py-3 bg-[#17365D] hover:bg-[#0B1F3A] text-white rounded-xl text-sm font-semibold">
              Browse all designs
            </AppLink>
          </>
        )}
      </div>
    );
  }

  const isFree = product.price === 0;
  const isPublished = product.status === 'published';
  const displayPrice = product.discountPrice ?? product.price;
  const activeImageSrc = product.galleryImages[activeImageIndex] || product.previewUrl;
  const packageFiles = (product.files || []).filter((f) => f.includedInPackage);
  const relatedProducts = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 3);
  const mailSubject = encodeURIComponent(`Purchase enquiry: ${product.title}`);
  const mailBody = encodeURIComponent(`Hello Graphics Expert,\n\nI would like to buy the design "${product.title}".\n\nPlease share the payment details.`);

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloading(fileId);
    if (isPublished) await downloadFreeFile(product, fileId, fileName);
    else await downloadAdminFile(product.id, fileId, fileName);
    setDownloading(null);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {!isPublished && (
        <div role="status" className="p-4 rounded-xl bg-[#EAF0F8] border border-[#C7D4E5] text-[#0B1F3A] text-sm flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Admin preview:</strong> this design is <span className="uppercase font-bold">{product.status}</span> and is not visible to the public.
          </span>
          <AppLink view="admin-dashboard" className="font-semibold underline">
            Back to admin
          </AppLink>
        </div>
      )}

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <AppLink view="marketplace" className="hover:text-[#0B1F3A] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Designs
        </AppLink>
        <span aria-hidden="true">/</span>
        <AppLink view="marketplace" categoryId={product.categoryId} className="hover:text-[#0B1F3A]">
          {product.categoryName}
        </AppLink>
        <span aria-hidden="true">/</span>
        <span className="text-[#0B1F3A] font-semibold truncate max-w-[16rem]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative flex items-center justify-center">
            {activeImageSrc ? (
              <>
                <img
                  src={activeImageSrc}
                  alt={`${product.title} — ${product.categoryName} design preview`}
                  onClick={() => setIsZoomOpen(true)}
                  className="w-full h-full object-cover object-center cursor-zoom-in"
                />
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-4 right-4 px-3 py-2 rounded-lg bg-[#0B1F3A]/85 hover:bg-[#0B1F3A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <ZoomIn className="w-4 h-4" />
                  Zoom
                </button>
              </>
            ) : (
              <div className="text-center text-slate-400 p-8">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-medium">No preview image</p>
              </div>
            )}
          </div>

          {product.galleryImages.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Show preview ${idx + 1}`}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#17365D] ring-2 ring-[#17365D]/15' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-[#17365D] shrink-0" />
              <div>
                <p className="font-semibold text-[#0B1F3A]">
                  {product.dpi} DPI · {product.colorMode}
                </p>
                <p className="text-xs text-slate-500">Print specifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-[#17365D] shrink-0" />
              <div>
                <p className="font-semibold text-[#0B1F3A]">Original source files</p>
                <p className="text-xs text-slate-500">Fully editable, not flattened</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
              <span className="font-semibold text-[#0B1F3A]">{product.categoryName}</span>
              {product.subcategory && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{product.subcategory}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] font-display leading-snug">{product.title}</h1>
            <p className="mt-2 text-sm text-slate-500">By {product.designerName}</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Price</span>
              {isFree ? (
                <span className="text-3xl font-extrabold text-[#0B1F3A]">Free</span>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0B1F3A] tabular-nums">${displayPrice.toFixed(2)}</span>
                  {product.discountPrice !== undefined && (
                    <span className="text-sm text-slate-400 line-through tabular-nums">${product.price.toFixed(2)}</span>
                  )}
                </div>
              )}
            </div>
            <span className="text-xs text-[#17365D] bg-[#EAF0F8] px-2.5 py-1 rounded-md border border-[#C7D4E5] font-semibold">
              {product.license} license
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>

          {isFree ? (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F3A]">Download</h2>
              {packageFiles.length === 0 ? (
                <p className="text-sm text-slate-500">No downloadable files are attached to this design yet.</p>
              ) : (
                packageFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleDownload(file.id, file.originalFileName)}
                    disabled={downloading === file.id}
                    className="w-full py-3.5 px-4 bg-[#17365D] hover:bg-[#0B1F3A] disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">Download .{file.format}</span>
                    </span>
                    <span className="font-mono text-xs opacity-80 shrink-0">{downloading === file.id ? 'Preparing…' : file.sizeFormatted}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#C7D4E5] bg-[#EAF0F8] space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F3A]">How to get this design</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                Online payment is not available yet. To buy this design, send us an email and we will reply with payment details and deliver the
                original files.
              </p>
              <a
                href={`mailto:graphicsexpert65@gmail.com?subject=${mailSubject}&body=${mailBody}`}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#17365D] hover:bg-[#0B1F3A] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email to purchase
              </a>
            </div>
          )}

          <dl className="pt-2 border-t border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
              <dt className="text-slate-500">Formats</dt>
              <dd className="font-semibold text-[#0B1F3A] text-right">{product.fileFormats.map((f) => `.${f}`).join(' ')}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
              <dt className="text-slate-500">Software</dt>
              <dd className="font-semibold text-[#0B1F3A] text-right">{product.softwareCompatibility.join(', ')}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
              <dt className="text-slate-500">Dimensions</dt>
              <dd className="font-semibold text-[#0B1F3A] text-right">{product.dimensions}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
              <dt className="text-slate-500">Package size</dt>
              <dd className="font-mono font-semibold text-[#0B1F3A]">{product.fileDownloadSize}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-[#0B1F3A] font-display mb-4">Files included ({packageFiles.length})</h2>
            {packageFiles.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {packageFiles.map((file) => (
                  <li key={file.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-[#0B1F3A] text-white font-mono text-[10px] font-bold shrink-0">.{file.format}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0B1F3A] truncate">{file.displayName}</p>
                        <p className="text-xs text-slate-500">
                          {file.softwareCompatibility} · {file.supportedVersion}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-500 shrink-0">{file.sizeFormatted}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {product.whatsIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#17365D] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1F3A] font-display mb-4">How to edit</h2>
            <ol className="space-y-3">
              {product.howToEdit.map((step, idx) => (
                <li key={step} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#17365D] text-white font-bold text-xs flex items-center justify-center shrink-0">{idx + 1}</span>
                  <p className="text-slate-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {product.tags.length > 0 && (
          <div className="md:col-span-5">
            <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-[#EAF0F8] text-[#17365D] text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-slate-200">
          <h2 className="text-xl font-bold text-[#0B1F3A] font-display mb-6">More {product.categoryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {isZoomOpen && activeImageSrc && (
        <div className="fixed inset-0 z-50 bg-[#0B1F3A]/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsZoomOpen(false)} role="dialog" aria-modal="true">
          <button type="button" onClick={() => setIsZoomOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Close zoomed preview">
            <X className="w-6 h-6" />
          </button>
          <img src={activeImageSrc} alt={product.title} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};
