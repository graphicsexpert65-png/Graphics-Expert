import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Download, CreditCard, CheckCircle2, ArrowRight, Smartphone, Building2 } from 'lucide-react';
import { Order } from '../types';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    currentUser,
    createOrder,
    setCurrentView,
    downloadDigitalAsset,
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [country, setCountry] = useState(currentUser?.country || 'Pakistan');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'easypaisa' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Items to Checkout</h2>
        <button
          onClick={() => setCurrentView('marketplace')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handlePayAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const order = await createOrder({
      customerName: name,
      customerEmail: email,
      customerCountry: country,
      paymentMethod:
        paymentMethod === 'card'
          ? 'Credit Card (Demo Mode)'
          : paymentMethod === 'jazzcash'
          ? 'JazzCash (Demo Mode)'
          : paymentMethod === 'easypaisa'
          ? 'EasyPaisa (Demo Mode)'
          : 'Bank Transfer (Demo Mode)',
    });

    if (order) {
      setCompletedOrder(order);
    }
    setIsProcessing(false);
  };

  // If order complete, show Success & Download Screen
  if (completedOrder) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Payment Confirmed (Demo Mode)
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1">
              Purchase Successful!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Order ID: <strong className="text-slate-900 font-mono">{completedOrder.id}</strong> · Receipt sent to {completedOrder.customerEmail}
            </p>
          </div>

          {/* Purchased Assets with Instant Download Tokens */}
          <div className="pt-6 border-t border-slate-100 text-left space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Your Purchased Digital Files
            </h3>

            {completedOrder.items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.productThumbnail && (
                      <img
                        src={item.productThumbnail}
                        alt={item.productTitle}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-white"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.productTitle}</h4>
                      <p className="text-[11px] text-slate-500">
                        License: {item.license} · Secured Token Active
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadDigitalAsset(completedOrder.id, item)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete Package</span>
                  </button>
                </div>

                {item.files && item.files.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2">
                    {item.files.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => downloadDigitalAsset(completedOrder.id, item, f.id, f.displayName)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span>{f.displayName}</span>
                        <span className="text-slate-400 font-mono">({f.sizeFormatted})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
            >
              Go to My Purchases Dashboard
            </button>
            <button
              onClick={() => setCurrentView('marketplace')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl"
            >
              Browse More Designs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 min-h-[75vh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">
            Checkout & Secure Download
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your information to generate commercial digital download credentials.
          </p>
        </div>

        <div className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 self-start sm:self-auto">
          PAYMENTS NOT CONNECTED
        </div>
      </div>

      <form onSubmit={handlePayAndDownload} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Customer Info & Payment Methods */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 font-display">1. Customer Details</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (For Downloads)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 font-display">2. Payment Setup</h2>
              <span className="text-[11px] text-slate-500">Gateway not configured</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-slate-700" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Card Payment</div>
                  <div className="text-[10px] text-slate-500">Visa, Mastercard, Amex</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('jazzcash')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'jazzcash'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">JazzCash (Pakistan)</div>
                  <div className="text-[10px] text-slate-500">Mobile wallet & OTP</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'easypaisa'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">EasyPaisa (Pakistan)</div>
                  <div className="text-[10px] text-slate-500">Instant direct transfer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Bank Transfer</div>
                  <div className="text-[10px] text-slate-500">IBAN & Swift</div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Note: This prototype simulates payment authorization. Real gateway hooks (Stripe, JazzCash API, PayPal) connect securely via server environment variables.
            </p>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-display">Items in Order</h2>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.license}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {item.product.previewUrl ? (
                    <img
                      src={item.product.previewUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded object-cover bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-100 shrink-0 flex items-center justify-center text-[10px] font-mono text-slate-500">
                      {item.product.fileFormats[0] || 'FILE'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.product.title}</p>
                    <p className="text-[11px] text-slate-500">{item.license}</p>
                  </div>
                </div>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({appliedCoupon.code}):</span>
                <span className="font-mono">-${cartDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total:</span>
              <span className="font-mono text-xl text-slate-900">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Online payment is not connected yet. Checkout and paid downloads will be enabled after a secure payment gateway is configured.
          </div>
          <button
            type="submit"
            disabled
            className="w-full py-3.5 px-4 bg-slate-300 text-slate-600 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Payments Coming Soon</span>
          </button>
        </div>

      </form>
    </div>
  );
};
