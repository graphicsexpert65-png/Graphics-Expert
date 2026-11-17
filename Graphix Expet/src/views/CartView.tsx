import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setCurrentView,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 px-4 max-w-2xl mx-auto text-center space-y-4 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          Discover ready-made design templates or use our free client-side image editing tools.
        </p>
        <button
          onClick={() => setCurrentView('marketplace')}
          className="mt-2 px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          Explore Templates
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 min-h-[75vh]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">
          Shopping Cart ({cart.length})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-medium"
        >
          Empty Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-3">
          {cart.map((item) => (
            <div
              key={`${item.product.id}-${item.license}`}
              className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                {item.product.previewUrl ? (
                  <img
                    src={item.product.previewUrl}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-[10px] font-mono text-slate-500">
                    {item.product.fileFormats[0] || 'FILE'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {item.product.categoryName} · {item.license}
                  </span>
                  <h3
                    onClick={() => setCurrentView('product-detail', { productId: item.product.id })}
                    className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                  >
                    {item.product.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {item.product.fileFormats.join('/')} · {item.product.dimensions}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Guarantee info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Files are verified 300 DPI CMYK press ready with organized layers.</span>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Order Summary
          </h2>

          <div className="space-y-2 text-xs border-b border-slate-100 pb-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Discount ({appliedCoupon.code}):
                </span>
                <span className="font-mono">-${cartDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total:</span>
              <span className="font-mono text-xl text-slate-900">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon Input */}
          <div>
            {appliedCoupon ? (
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center justify-between text-emerald-800">
                <span>Code <strong>{appliedCoupon.code}</strong> active</span>
                <button onClick={removeCoupon} className="text-emerald-700 underline font-medium">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
              </form>
            )}
          </div>

          {/* Checkout CTA */}
          <button
            onClick={() => setCurrentView('checkout')}
            className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
