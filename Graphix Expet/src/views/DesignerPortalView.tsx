import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileFormat, LicenseType } from '../types';
import {
  Palette,
  Upload,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileCheck,
} from 'lucide-react';

export const DesignerPortalView: React.FC = () => {
  const {
    currentUser,
    designerSubmissions,
    addDesignerSubmission,
    categories,
    switchRole,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'submissions' | 'upload' | 'earnings'>('submissions');

  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'CorelDRAW Designs');
  const [price, setPrice] = useState(4.99);
  const [dimensions, setDimensions] = useState('8.5 × 11 in (US Letter)');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<FileFormat[]>(['CDR', 'AI', 'PSD']);

  const handleToggleFormat = (fmt: FileFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addDesignerSubmission({
      designerId: currentUser?.id || 'usr_des_02',
      designerName: currentUser?.name || 'Contributor Studio',
      title,
      category,
      price: Number(price),
      dimensions,
      fileFormats: selectedFormats,
      previewUrl,
    });

    setTitle('');
    setActiveTab('submissions');
  };

  const availableFormats: FileFormat[] = ['CDR', 'AI', 'EPS', 'PSD', 'PSB', 'PDF', 'PNG', 'JPG', 'TIF', 'ZIP'];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 min-h-[75vh]">
      
      {/* Designer Header */}
      <div className="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Designer Contributor Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            Sell Your Designs. Earn on Every Download.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Upload editable templates for Pakistani and international businesses. Keep up to 70% of every template sale.
          </p>
        </div>

        {currentUser?.role !== 'designer' && (
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs self-start md:self-auto">
            <span className="text-slate-300 block mb-1.5">Viewing as standard user?</span>
            <button
              onClick={() => switchRole('designer')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Palette className="w-3.5 h-3.5" />
              Switch to Designer Profile
            </button>
          </div>
        )}
      </div>

      {/* How it Works Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900">01. Create</span>
          <p className="text-slate-500">Design quality 300 DPI templates</p>
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900">02. Upload</span>
          <p className="text-slate-500">Provide preview & vector/PSD master</p>
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900">03. Review</span>
          <p className="text-slate-500">Fast 24-hr QA verification</p>
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900">04. Publish</span>
          <p className="text-slate-500">Go live in marketplace</p>
        </div>
        <div className="space-y-0.5 col-span-2 md:col-span-1">
          <span className="font-bold text-emerald-700">05. Earn</span>
          <p className="text-slate-500">Direct monthly bank payouts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Total Sales</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {currentUser?.totalSales ?? 0}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Available Balance</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            ${(currentUser?.balance ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Submissions</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {designerSubmissions.length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Payout Schedule</span>
          <span className="text-xs font-bold text-slate-900 block mt-2">
            Monthly ($50 minimum)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'submissions'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Submissions ({designerSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'upload'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Upload New Design
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'earnings'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Earnings & Payouts
        </button>
      </div>

      {/* Tab: Submissions Table */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Submitted Designs & Status</span>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Upload Design
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {designerSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No designer submissions yet. Use "Upload New Design" to submit your first template for review.
              </div>
            ) : (
              designerSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    {sub.previewUrl ? (
                      <img
                        src={sub.previewUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-14 h-12 rounded object-cover bg-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-12 rounded bg-slate-100 shrink-0 flex items-center justify-center text-[10px] font-mono text-slate-500">
                        {sub.fileFormats[0] || 'FILE'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900">{sub.title}</h4>
                      <p className="text-slate-500 text-[11px]">
                        {sub.category} · {sub.dimensions} · {sub.fileFormats.join('/')} ·{' '}
                        <span className="font-mono font-semibold">${sub.price.toFixed(2)}</span>
                      </p>
                      {sub.reviewNote && (
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">Note: {sub.reviewNote}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        sub.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.status === 'Pending Review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Upload Design Form */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Submit Template for Review
          </h2>
          <p className="text-slate-500 text-xs">
            Files must be 300 DPI with CMYK or RGB color profile. We accept CorelDraw (.CDR), Adobe Photoshop (.PSD), Adobe Illustrator (.AI), and vector PDF files. For CorelDraw submissions, ensure fonts are either packaged or converted to curves (Ctrl+Q).
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Template Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Minimalist Coffee Shop Menu Bi-Fold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Price (USD) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dimensions & Specs</label>
            <input
              type="text"
              placeholder="e.g. 5 × 7 in (A7) + 0.125 in Bleed"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Supported File Formats</label>
            <div className="flex flex-wrap gap-2">
              {availableFormats.map((fmt) => (
                <button
                  type="button"
                  key={fmt}
                  onClick={() => handleToggleFormat(fmt)}
                  className={`px-3 py-1.5 rounded-lg border font-medium ${
                    selectedFormats.includes(fmt)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : fmt === 'CDR'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {fmt === 'CDR' ? 'CorelDraw (.CDR)' : fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preview Image URL / Mockup Asset</label>
            <input
              type="text"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Submit Design for Admin Review
            </button>
          </div>
        </form>
      )}

      {/* Tab: Earnings & Payouts */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Payout System & Earnings Ledger
            </h3>
            <p className="text-slate-500">
              Payouts are disbursed automatically on the 1st of each calendar month for accounts with balances over $50.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-slate-400 block text-[10px]">Payout Configuration</span>
              <p className="font-bold text-slate-900">Configure bank IBAN or JazzCash/EasyPaisa when balance exceeds $50.00</p>
            </div>
            <button
              onClick={() => addToast('Payout Notice', 'Available balance must reach $50.00 before payout.', 'info')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
            >
              Request Payout (${(currentUser?.balance ?? 0).toFixed(2)})
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
