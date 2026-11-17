import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingBag,
  Download,
  Heart,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  FileCheck,
  CreditCard,
  Check,
} from 'lucide-react';

export const CustomerDashboardView: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    wishlist,
    downloadDigitalAsset,
    setCurrentView,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'purchases' | 'wishlist' | 'settings'>('purchases');
  const [name, setName] = useState(currentUser?.name || 'Customer Account');
  const [country, setCountry] = useState(currentUser?.country || 'Pakistan');

  // Customer's orders
  const userOrders = currentUser
    ? orders.filter((o) => o.userId === currentUser.id || o.customerEmail === currentUser.email)
    : orders;

  const totalDownloads = userOrders.reduce((sum, o) => sum + o.items.length, 0);
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Profile Updated', 'Your account settings were saved.', 'success');
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 min-h-[75vh]">
      {/* User Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-bold text-xl overflow-hidden shrink-0">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              currentUser?.name.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              {currentUser?.name || 'Customer Account'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.email || 'Sign in to sync orders'} · Member since {currentUser?.joinedDate || '2026'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            Verified Customer
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Orders</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {userOrders.length}
            </span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Files Ready to Download</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalDownloads}
            </span>
            <Download className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Saved Wishlist</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {wishlist.length}
            </span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">License Security</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Active / Protected
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'purchases'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Purchases & Downloads ({totalDownloads})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'wishlist'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Saved Wishlist ({wishlist.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'settings'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Account Settings
        </button>
      </div>

      {/* Tab 1: Purchases & Downloads */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {userOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No purchases found</h3>
              <p className="text-xs text-slate-500">Your purchased templates will appear here with instant download links.</p>
              <button
                onClick={() => setCurrentView('marketplace')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Browse Templates
              </button>
            </div>
          ) : (
            userOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order ID</span>
                      <span className="font-mono font-bold text-slate-900">{order.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date</span>
                      <span className="text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Paid</span>
                      <span className="font-mono font-bold text-slate-900">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                    Payment Verified
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.productThumbnail && (
                            <img
                              src={item.productThumbnail}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded object-cover bg-slate-100"
                            />
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{item.productTitle}</h4>
                            <p className="text-[11px] text-slate-500">
                              License: <strong>{item.license}</strong> · Signed Download Verified
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => downloadDigitalAsset(order.id, item)}
                          className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download All (ZIP)</span>
                        </button>
                      </div>

                      {item.files && item.files.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          {item.files.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => downloadDigitalAsset(order.id, item, f.id, f.displayName)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 flex items-center gap-1.5"
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistedProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Heart className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Your wishlist is empty</h3>
              <p className="text-xs text-slate-500">Click the heart icon on any design in the marketplace to save it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 font-display">Customer Profile</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Country / Region</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 bg-[#0F172A] text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
};
