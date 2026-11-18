import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductStatus, LicenseType } from '../types';
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Eye,
  Copy,
  Upload,
  FileCode2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  HardDrive,
  RefreshCw,
  Tag,
  Star,
  AlertTriangle,
  X,
  ArrowLeft,
  FolderPlus,
} from 'lucide-react';

interface StagedNewFile {
  localId: string;
  file: File;
  displayName: string;
  format: string;
  softwareCompatibility: string;
  supportedVersion: string;
  includedInPackage: boolean;
}

interface ExistingFileEditState {
  id: string;
  displayName: string;
  originalFileName: string;
  format: string;
  sizeFormatted: string;
  softwareCompatibility: string;
  supportedVersion: string;
  includedInPackage: boolean;
  remove: boolean;
  replacementFile?: File;
}

const ALLOWED_EXTENSIONS = [
  '.cdr',
  '.ai',
  '.eps',
  '.psd',
  '.psb',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.tif',
  '.tiff',
  '.zip',
];

const NON_BROWSER_FORMATS = new Set(['CDR', 'AI', 'EPS', 'PSD', 'PSB', 'TIF', 'TIFF', 'ZIP', 'PDF']);

const SOFTWARE_PRESETS = [
  'CorelDRAW X7–2024',
  'Adobe Illustrator',
  'Adobe Photoshop',
  'Adobe Acrobat / PDF',
  'Canva',
];

function detectFormatFromName(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
}

function defaultSoftwareForFormat(fmt: string): { software: string; version: string } {
  switch (fmt) {
    case 'CDR':
      return { software: 'CorelDRAW', version: 'X7 – 2024' };
    case 'AI':
      return { software: 'Adobe Illustrator', version: 'CC 2019+' };
    case 'EPS':
      return { software: 'Illustrator / CorelDRAW', version: 'EPS 10+' };
    case 'PSD':
    case 'PSB':
      return { software: 'Adobe Photoshop', version: 'CC 2018+' };
    case 'PDF':
      return { software: 'Print Press PDF / Acrobat', version: 'PDF 1.4+' };
    case 'ZIP':
      return { software: 'Multi-Format Archive', version: 'Standard ZIP' };
    default:
      return { software: 'Universal Graphic Editor', version: 'High-Res' };
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AdminDashboardView: React.FC = () => {
  const {
    currentUser,
    openAuthModal,
    adminProducts,
    categories,
    orders,
    customRequests,
    designerSubmissions,
    coupons,
    storageStatus,
    uploadNewDesign,
    updateAdminDesign,
    updateProductStatus,
    duplicateProduct,
    deleteProduct,
    updateCustomRequestStatus,
    updateDesignerSubmissionStatus,
    createCoupon,
    deleteCoupon,
    setCurrentView,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'designs' | 'upload' | 'orders' | 'requests' | 'submissions' | 'coupons' | 'storage'
  >('designs');

  // My Designs filters
  const [designSearch, setDesignSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Upload / Edit Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'coreldraw-designs');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState<string>('12.00');
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [dimensions, setDimensions] = useState('8.5 × 11 in + 0.125 in Bleed');
  const [colorMode, setColorMode] = useState<'CMYK' | 'RGB'>('CMYK');
  const [dpi, setDpi] = useState<string>('300');
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(['CorelDRAW X7–2024']);
  const [customSoftwareInput, setCustomSoftwareInput] = useState('');
  const [license, setLicense] = useState<LicenseType>('Commercial');
  const [tagsInput, setTagsInput] = useState('');
  const [featured, setFeatured] = useState<boolean>(true);
  const [status, setStatus] = useState<ProductStatus>('published');

  // Preview images
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewDataUrl, setCoverPreviewDataUrl] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [retainedGalleryImages, setRetainedGalleryImages] = useState<string[]>([]);

  // Original design files
  const [stagedNewFiles, setStagedNewFiles] = useState<StagedNewFile[]>([]);
  const [existingFilesEdit, setExistingFilesEdit] = useState<ExistingFileEditState[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<string>('15');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<string>('0');
  const [newCouponExpiry, setNewCouponExpiry] = useState('2027-12-31');

  const maxUploadMb = storageStatus?.maxUploadSizeMb || 250;

  const resetForm = () => {
    setEditingProductId(null);
    setTitle('');
    setShortDescription('');
    setDescription('');
    setCategoryId(categories[0]?.id || 'coreldraw-designs');
    setSubcategory('');
    setPrice('12.00');
    setDiscountPrice('');
    setDimensions('8.5 × 11 in + 0.125 in Bleed');
    setColorMode('CMYK');
    setDpi('300');
    setSelectedSoftware(['CorelDRAW X7–2024']);
    setCustomSoftwareInput('');
    setLicense('Commercial');
    setTagsInput('');
    setFeatured(true);
    setStatus('published');
    setCoverFile(null);
    setCoverPreviewDataUrl(null);
    setGalleryFiles([]);
    setGalleryPreviewUrls([]);
    setRetainedGalleryImages([]);
    setStagedNewFiles([]);
    setExistingFilesEdit([]);
    setFormError(null);
  };

  const openNewUploadTab = () => {
    resetForm();
    setActiveTab('upload');
  };

  const openEditDesign = (p: Product) => {
    setEditingProductId(p.id);
    setTitle(p.title);
    setShortDescription(p.shortDescription || '');
    setDescription(p.description || '');
    setCategoryId(p.categoryId);
    setSubcategory(p.subcategory || '');
    setPrice(String(p.price));
    setDiscountPrice(p.discountPrice !== undefined ? String(p.discountPrice) : '');
    setDimensions(p.dimensions || '');
    setColorMode(p.colorMode || 'CMYK');
    setDpi(String(p.dpi || 300));
    setSelectedSoftware(p.softwareCompatibility || []);
    setCustomSoftwareInput('');
    setLicense(p.license || 'Commercial');
    setTagsInput((p.tags || []).join(', '));
    setFeatured(Boolean(p.featured));
    setStatus(p.status);
    setCoverFile(null);
    setCoverPreviewDataUrl(null);
    setGalleryFiles([]);
    setGalleryPreviewUrls([]);
    setRetainedGalleryImages(p.galleryImages || []);
    setStagedNewFiles([]);
    setExistingFilesEdit(
      (p.files || []).map((f) => ({
        id: f.id,
        displayName: f.displayName,
        originalFileName: f.originalFileName,
        format: f.format,
        sizeFormatted: f.sizeFormatted,
        softwareCompatibility: f.softwareCompatibility,
        supportedVersion: f.supportedVersion,
        includedInPackage: f.includedInPackage,
        remove: false,
      }))
    );
    setFormError(null);
    setActiveTab('upload');
  };

  // Handle Cover Image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      setFormError('Cover preview must be a PNG, JPG, JPEG, or WEBP image.');
      return;
    }
    setFormError(null);
    setCoverFile(file);
    setCoverPreviewDataUrl(URL.createObjectURL(file));
  };

  // Handle Gallery Images selection
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    const urls: string[] = [];
    for (const f of files) {
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        setFormError(`"${f.name}" is not a valid preview image (PNG, JPG, WEBP only).`);
        continue;
      }
      valid.push(f);
      urls.push(URL.createObjectURL(f));
    }
    setGalleryFiles((prev) => [...prev, ...valid]);
    setGalleryPreviewUrls((prev) => [...prev, ...urls]);
  };

  // Handle Multi-Format Original Source Files selection
  const handleDesignFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const accepted: StagedNewFile[] = [];

    for (const f of files) {
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFormError(
          `Unsupported file "${f.name}". Allowed: CDR, AI, EPS, PSD, PSB, PDF, PNG, JPG, JPEG, TIF, TIFF, ZIP.`
        );
        continue;
      }
      if (f.size > maxUploadMb * 1024 * 1024) {
        setFormError(`"${f.name}" exceeds the ${maxUploadMb} MB file size limit.`);
        continue;
      }
      const fmt = detectFormatFromName(f.name);
      const defaults = defaultSoftwareForFormat(fmt);
      accepted.push({
        localId: 'staged_' + Math.random().toString(36).slice(2, 9),
        file: f,
        displayName: f.name,
        format: fmt,
        softwareCompatibility: defaults.software,
        supportedVersion: defaults.version,
        includedInPackage: true,
      });
    }

    if (accepted.length > 0) {
      setFormError(null);
      setStagedNewFiles((prev) => [...prev, ...accepted]);
    }
    e.target.value = '';
  };

  const handleToggleSoftwarePreset = (preset: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(preset) ? prev.filter((item) => item !== preset) : [...prev, preset]
    );
  };

  // Compute whether preview image is strictly required
  const activeFormatsInForm = useMemo(() => {
    const existingFmts = existingFilesEdit.filter((f) => !f.remove).map((f) => f.format);
    const stagedFmts = stagedNewFiles.map((f) => f.format);
    return Array.from(new Set([...existingFmts, ...stagedFmts]));
  }, [existingFilesEdit, stagedNewFiles]);

  const requiresPreviewImage = activeFormatsInForm.some((fmt) => NON_BROWSER_FORMATS.has(fmt));
  const hasAnyPreview =
    Boolean(coverFile) || galleryFiles.length > 0 || retainedGalleryImages.length > 0;

  const handleSubmitDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Design Title is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Please enter a valid selling price.');
      return;
    }
    if (discountPrice.trim()) {
      const parsedDiscount = parseFloat(discountPrice);
      if (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount >= parsedPrice) {
        setFormError('Discount price must be lower than the selling price.');
        return;
      }
    }

    const activeExisting = existingFilesEdit.filter((f) => !f.remove);
    if (!editingProductId && stagedNewFiles.length === 0) {
      setFormError('Please upload at least one original design file (.CDR, .AI, .PSD, .EPS, .PDF, .ZIP, etc.).');
      return;
    }
    if (editingProductId && activeExisting.length === 0 && stagedNewFiles.length === 0) {
      setFormError('A design product must retain at least one original source file.');
      return;
    }
    if (requiresPreviewImage && !hasAnyPreview) {
      setFormError(
        'A cover or gallery preview image is required because this design includes non-browser-previewable files (CDR, AI, EPS, PSD, PSB, TIFF, PDF, or ZIP).'
      );
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId) || categories[0];
    const extraSoftware = customSoftwareInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allSoftware = Array.from(new Set([...selectedSoftware, ...extraSoftware]));
    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('shortDescription', shortDescription.trim());
    fd.append('description', description.trim());
    fd.append('categoryId', catObj.id);
    fd.append('categoryName', catObj.name);
    fd.append('subcategory', subcategory.trim());
    fd.append('price', String(parsedPrice));
    fd.append('discountPrice', discountPrice.trim());
    fd.append('dimensions', dimensions.trim());
    fd.append('colorMode', colorMode);
    fd.append('dpi', dpi);
    fd.append('softwareCompatibility', JSON.stringify(allSoftware));
    fd.append('license', license);
    fd.append('tags', JSON.stringify(tagsArray));
    fd.append('featured', String(featured));
    fd.append('status', status);

    if (coverFile) {
      fd.append('coverPreview', coverFile);
    }
    for (const gf of galleryFiles) {
      fd.append('galleryPreviews', gf);
    }

    setIsSubmitting(true);
    try {
      if (!editingProductId) {
        // Creating new product
        fd.append(
          'filesMeta',
          JSON.stringify(
            stagedNewFiles.map((s) => ({
              displayName: s.displayName.trim() || s.file.name,
              softwareCompatibility: s.softwareCompatibility.trim() || s.format,
              supportedVersion: s.supportedVersion.trim() || 'Standard',
              includedInPackage: s.includedInPackage,
            }))
          )
        );
        for (const s of stagedNewFiles) {
          fd.append('designFiles', s.file);
        }

        const result = await uploadNewDesign(fd);
        if (!result.success) {
          setFormError(result.error || 'Failed to upload design.');
          setIsSubmitting(false);
          return;
        }
        resetForm();
        setActiveTab('designs');
      } else {
        // Updating existing product
        fd.append('retainedGalleryImages', JSON.stringify(retainedGalleryImages));
        fd.append(
          'existingFilesMeta',
          JSON.stringify(
            existingFilesEdit.map((ef) => ({
              id: ef.id,
              displayName: ef.displayName.trim() || ef.originalFileName,
              softwareCompatibility: ef.softwareCompatibility.trim(),
              supportedVersion: ef.supportedVersion.trim(),
              includedInPackage: ef.includedInPackage,
              remove: ef.remove,
            }))
          )
        );

        const replacements = existingFilesEdit.filter((ef) => !ef.remove && ef.replacementFile);
        fd.append('replacementTargetIds', JSON.stringify(replacements.map((r) => r.id)));
        for (const r of replacements) {
          if (r.replacementFile) fd.append('replacementFiles', r.replacementFile);
        }

        fd.append(
          'newFilesMeta',
          JSON.stringify(
            stagedNewFiles.map((s) => ({
              displayName: s.displayName.trim() || s.file.name,
              softwareCompatibility: s.softwareCompatibility.trim() || s.format,
              supportedVersion: s.supportedVersion.trim() || 'Standard',
              includedInPackage: s.includedInPackage,
            }))
          )
        );
        for (const s of stagedNewFiles) {
          fd.append('designFiles', s.file);
        }

        const result = await updateAdminDesign(editingProductId, fd);
        if (!result.success) {
          setFormError(result.error || 'Failed to update design.');
          setIsSubmitting(false);
          return;
        }
        resetForm();
        setActiveTab('designs');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered My Designs list
  const filteredAdminProducts = useMemo(() => {
    return adminProducts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (designSearch.trim()) {
        const q = designSearch.toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          (p.subcategory || '').toLowerCase().includes(q) ||
          p.fileFormats.some((f) => f.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [adminProducts, statusFilter, designSearch]);

  const publishedCount = adminProducts.filter((p) => p.status === 'published').length;
  const draftCount = adminProducts.filter((p) => p.status === 'draft').length;
  const unpublishedCount = adminProducts.filter((p) => p.status === 'unpublished').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingRequests = customRequests.filter((r) => r.status === 'Pending' || r.status === 'In Review');

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const ok = await createCoupon({
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      value: parseFloat(newCouponValue) || 10,
      minOrder: parseFloat(newCouponMinOrder) || 0,
      expiry: newCouponExpiry,
    });
    if (ok) {
      setNewCouponCode('');
    }
  };

  // Admin Access Guard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Graphics Expert Administrator Access Required
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sign in with the owner administrator account to upload designs and manage the marketplace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Admin Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 min-h-[75vh]">
      {/* Admin Header */}
      <div className="bg-[#0F172A] text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              GRAPHICS EXPERT · ADMIN STUDIO
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display">Design Upload & Marketplace Operations</h1>
          <p className="text-xs text-slate-300 mt-1">
            Owner: <span className="font-mono text-white">{currentUser.email}</span> · Originals protected in private server storage; previews served publicly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewUploadTab}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Design</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Total Designs</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{adminProducts.length}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Published</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">{publishedCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Draft / Hidden</span>
          <span className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {draftCount + unpublishedCount}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Total Orders</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{orders.length}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Gross Revenue</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">${totalRevenue.toFixed(2)}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500 block mb-1">Custom Leads</span>
          <span className="text-2xl font-bold text-blue-600 font-mono tabular-nums">{pendingRequests.length}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-5 text-xs font-semibold">
        {[
          { id: 'designs', label: `My Designs (${adminProducts.length})` },
          { id: 'upload', label: editingProductId ? 'Edit Design Package' : 'Upload New Design' },
          { id: 'orders', label: `Orders & Downloads (${orders.length})` },
          { id: 'requests', label: `Custom Requests (${customRequests.length})` },
          { id: 'submissions', label: `Designer Queue (${designerSubmissions.length})` },
          { id: 'coupons', label: `Coupons (${coupons.length})` },
          { id: 'storage', label: 'Storage & Environment' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab.id
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: MANAGE MY DESIGNS                                         */}
      {/* ================================================================ */}
      {activeTab === 'designs' && (
        <div className="space-y-4">
          {adminProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Start Building Your Marketplace
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload your first original design to begin selling.
              </p>
              <div className="pt-2">
                <button
                  onClick={openNewUploadTab}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Design</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
              {/* Filter & Search Toolbar */}
              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Designs (${adminProducts.length})` },
                    { id: 'published', label: `Published (${publishedCount})` },
                    { id: 'draft', label: `Draft (${draftCount})` },
                    { id: 'unpublished', label: `Unpublished (${unpublishedCount})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id as 'all' | ProductStatus)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        statusFilter === f.id
                          ? 'bg-[#0F172A] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search my designs..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Searchable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Preview</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">File Formats</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Upload Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdminProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <div className="w-14 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {p.previewUrl ? (
                              <img
                                src={p.previewUrl}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span className="truncate">{p.title}</span>
                            {p.featured && (
                              <span title="Featured Design" className="inline-flex shrink-0">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {p.files?.length || 0} source file{(p.files?.length || 0) === 1 ? '' : 's'} · {p.fileDownloadSize}
                            {p.subcategory ? ` · ${p.subcategory}` : ''}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">{p.categoryName}</td>
                        <td className="p-3">
                          <span className="font-mono font-semibold text-slate-800">
                            {p.fileFormats.join(', ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono tabular-nums">
                          {p.discountPrice !== undefined ? (
                            <div>
                              <span className="font-bold text-slate-900">${p.discountPrice.toFixed(2)}</span>
                              <span className="text-[11px] text-slate-400 line-through ml-1">
                                ${p.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900">${p.price.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 tabular-nums whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] capitalize ${
                              p.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'draft'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => openEditDesign(p)}
                              className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1"
                              title="Edit design & manage files"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => setCurrentView('product-detail', { productId: p.id })}
                              className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1"
                              title="Preview product detail page"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            {p.status === 'published' ? (
                              <button
                                onClick={() => updateProductStatus(p.id, 'unpublished')}
                                className="px-2 py-1 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={() => updateProductStatus(p.id, 'published')}
                                className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => duplicateProduct(p.id)}
                              className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1"
                              title="Duplicate as Draft"
                            >
                              <Copy className="w-3 h-3" />
                              Duplicate
                            </button>
                            {confirmDeleteId === p.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    deleteProduct(p.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded border border-slate-200 text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium inline-flex items-center gap-1"
                                title="Delete design"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAdminProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No designs matched your search or status filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: UPLOAD NEW DESIGN / EDIT DESIGN & MULTI-FILE MANAGER      */}
      {/* ================================================================ */}
      {activeTab === 'upload' && (
        <form onSubmit={handleSubmitDesign} className="space-y-6 text-xs">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('designs');
                }}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  {editingProductId ? `Edit Design: ${title}` : 'Upload New Original Design'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Original .CDR, .AI, .EPS, .PSD, .PSB, .PDF, and .ZIP files are preserved byte-for-byte in private server storage.
                </p>
              </div>
            </div>
            {editingProductId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-blue-600 hover:underline font-semibold"
              >
                + Switch to New Upload
              </button>
            )}
          </div>

          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">{formError}</div>
              <button type="button" onClick={() => setFormError(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Metadata, Pricing, Specs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 font-display border-b border-slate-100 pb-2">
                  1. Design Details & Categorization
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Design Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Professional Restaurant Menu (CDR + AI + PSD)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="Concise one-line summary displayed on marketplace cards"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe layers, bleed margins, font instructions, print compatibility, and package contents..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      placeholder="e.g. Tri-Fold Menu, Nikkah Card, Panaflex"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Selling Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Discount Price (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Leave blank if none"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License Type</label>
                    <select
                      value={license}
                      onChange={(e) => setLicense(e.target.value as LicenseType)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Extended Commercial">Extended Commercial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technical Print & Software Specs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 font-display border-b border-slate-100 pb-2">
                  2. Print & Technical Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Design Dimensions</label>
                    <input
                      type="text"
                      placeholder="e.g. 2.5 × 6 ft or A4"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Color Mode</label>
                    <select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as 'CMYK' | 'RGB')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="CMYK">CMYK (Print Ready)</option>
                      <option value="RGB">RGB (Digital / Screen)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Resolution (DPI)</label>
                    <input
                      type="number"
                      min="72"
                      max="1200"
                      value={dpi}
                      onChange={(e) => setDpi(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Software Compatibility</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SOFTWARE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleToggleSoftwarePreset(preset)}
                        className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                          selectedSoftware.includes(preset)
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Additional software (comma-separated, e.g. CorelDRAW 2024, InDesign)"
                    value={customSoftwareInput}
                    onChange={(e) => setCustomSoftwareInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="menu, cdr, restaurant, print"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Featured Design</label>
                    <div className="flex gap-2">
                      {[
                        { val: true, label: 'Yes' },
                        { val: false, label: 'No' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={String(opt.val)}
                          onClick={() => setFeatured(opt.val)}
                          className={`flex-1 py-2 rounded-lg border font-semibold ${
                            featured === opt.val
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Product Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProductStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold"
                    >
                      <option value="published">Published (Live in Store)</option>
                      <option value="draft">Draft (Hidden from Public)</option>
                      <option value="unpublished">Unpublished (Archived)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Preview Images & Multi-File Source Package Manager */}
            <div className="lg:col-span-5 space-y-6">
              {/* Public Preview Images */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    3. Public Preview Images
                  </h3>
                  {requiresPreviewImage && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Required for CDR/AI/PSD/ZIP
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Buyers see only these watermarked/preview images before purchase. Original editable files stay protected in private storage.
                </p>

                {/* Main Cover Image */}
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Main Cover Image</label>
                  <label className="block border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    {coverPreviewDataUrl ? (
                      <div className="space-y-2">
                        <img
                          src={coverPreviewDataUrl}
                          alt="New Cover Preview"
                          className="w-full h-36 object-cover rounded-lg border border-slate-200"
                        />
                        <span className="text-[11px] font-semibold text-blue-600 block">
                          Click to replace cover image ({coverFile?.name})
                        </span>
                      </div>
                    ) : retainedGalleryImages[0] ? (
                      <div className="space-y-2">
                        <img
                          src={retainedGalleryImages[0]}
                          alt="Current Cover"
                          className="w-full h-36 object-cover rounded-lg border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-500 block">
                          Current cover active — click to upload replacement
                        </span>
                      </div>
                    ) : (
                      <div className="py-3 space-y-1">
                        <ImageIcon className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">Upload Main Cover Preview</p>
                        <p className="text-[11px] text-slate-400">PNG, JPG, JPEG, WEBP (up to 25 MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Additional Gallery Images */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Additional Gallery Images</label>
                    <label className="text-blue-600 hover:underline font-semibold cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleGalleryChange}
                        className="hidden"
                      />
                      + Add Gallery Photos
                    </label>
                  </div>

                  {(retainedGalleryImages.length > 0 || galleryPreviewUrls.length > 0) && (
                    <div className="grid grid-cols-4 gap-2">
                      {retainedGalleryImages.map((url, idx) => (
                        <div key={`ret-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setRetainedGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="absolute top-1 right-1 p-0.5 rounded bg-slate-900/80 text-white hover:bg-rose-600"
                            title="Remove preview image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {galleryPreviewUrls.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-blue-400">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
                              setGalleryPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 p-0.5 rounded bg-slate-900/80 text-white hover:bg-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Protected Original Source Files Manager */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-amber-600" />
                    <span>4. Protected Original Design Files</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supported: <strong>.CDR, .AI, .EPS, .PSD, .PSB, .PDF, .PNG, .JPG, .JPEG, .TIF, .TIFF, .ZIP</strong> (Max {maxUploadMb} MB/file). Preserved untouched.
                  </p>
                </div>

                {/* File Drop / Add Trigger */}
                <label className="block border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 rounded-xl p-4 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    onChange={handleDesignFilesChange}
                    className="hidden"
                  />
                  <FolderPlus className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                  <p className="font-bold text-slate-900">
                    {editingProductId ? 'Add More Design Files to Package' : 'Upload Original Design Files'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Select multiple formats (e.g. .cdr + .ai + .psd + .eps + .pdf or .zip)
                  </p>
                </label>

                {/* Existing Files (when Editing) */}
                {existingFilesEdit.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Existing Package Files ({existingFilesEdit.filter((f) => !f.remove).length})
                    </p>
                    {existingFilesEdit.map((ef) => (
                      <div
                        key={ef.id}
                        className={`p-3 rounded-xl border space-y-2 ${
                          ef.remove ? 'bg-rose-50/60 border-rose-200 opacity-60' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                              .{ef.format}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{ef.sizeFormatted}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!ef.remove && (
                              <label className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Replace
                                <input
                                  type="file"
                                  accept={ALLOWED_EXTENSIONS.join(',')}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setExistingFilesEdit((prev) =>
                                      prev.map((item) =>
                                        item.id === ef.id
                                          ? {
                                              ...item,
                                              replacementFile: file,
                                              format: detectFormatFromName(file.name),
                                              sizeFormatted: formatFileSize(file.size),
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExistingFilesEdit((prev) =>
                                  prev.map((item) =>
                                    item.id === ef.id ? { ...item, remove: !item.remove } : item
                                  )
                                )
                              }
                              className="text-[11px] text-rose-600 hover:underline font-semibold"
                            >
                              {ef.remove ? 'Undo Remove' : 'Remove'}
                            </button>
                          </div>
                        </div>

                        {ef.replacementFile && !ef.remove && (
                          <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center justify-between">
                            <span>Replacing with: {ef.replacementFile.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setExistingFilesEdit((prev) =>
                                  prev.map((item) =>
                                    item.id === ef.id ? { ...item, replacementFile: undefined } : item
                                  )
                                )
                              }
                              className="underline"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {!ef.remove && (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={ef.displayName}
                              onChange={(e) =>
                                setExistingFilesEdit((prev) =>
                                  prev.map((item) =>
                                    item.id === ef.id ? { ...item, displayName: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="Display filename"
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white text-[11px] font-medium"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={ef.softwareCompatibility}
                                onChange={(e) =>
                                  setExistingFilesEdit((prev) =>
                                    prev.map((item) =>
                                      item.id === ef.id
                                        ? { ...item, softwareCompatibility: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                placeholder="Software"
                                className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px]"
                              />
                              <input
                                type="text"
                                value={ef.supportedVersion}
                                onChange={(e) =>
                                  setExistingFilesEdit((prev) =>
                                    prev.map((item) =>
                                      item.id === ef.id
                                        ? { ...item, supportedVersion: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                placeholder="Supported version"
                                className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px]"
                              />
                            </div>
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer pt-0.5">
                              <input
                                type="checkbox"
                                checked={ef.includedInPackage}
                                onChange={(e) =>
                                  setExistingFilesEdit((prev) =>
                                    prev.map((item) =>
                                      item.id === ef.id
                                        ? { ...item, includedInPackage: e.target.checked }
                                        : item
                                    )
                                  )
                                }
                              />
                              <span>Include in customer download package</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Newly Staged Files */}
                {stagedNewFiles.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      New Files Queued ({stagedNewFiles.length})
                    </p>
                    {stagedNewFiles.map((sf) => (
                      <div
                        key={sf.localId}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                              .{sf.format}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {formatFileSize(sf.file.size)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setStagedNewFiles((prev) => prev.filter((item) => item.localId !== sf.localId))
                            }
                            className="text-[11px] text-rose-600 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          value={sf.displayName}
                          onChange={(e) =>
                            setStagedNewFiles((prev) =>
                              prev.map((item) =>
                                item.localId === sf.localId ? { ...item, displayName: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Display file name (e.g. Restaurant-Menu.cdr)"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white text-[11px] font-medium"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sf.softwareCompatibility}
                            onChange={(e) =>
                              setStagedNewFiles((prev) =>
                                prev.map((item) =>
                                  item.localId === sf.localId
                                    ? { ...item, softwareCompatibility: e.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Software (e.g. CorelDRAW)"
                            className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px]"
                          />
                          <input
                            type="text"
                            value={sf.supportedVersion}
                            onChange={(e) =>
                              setStagedNewFiles((prev) =>
                                prev.map((item) =>
                                  item.localId === sf.localId
                                    ? { ...item, supportedVersion: e.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Version (e.g. X7 – 2024)"
                            className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px]"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={sf.includedInPackage}
                            onChange={(e) =>
                              setStagedNewFiles((prev) =>
                                prev.map((item) =>
                                  item.localId === sf.localId
                                    ? { ...item, includedInPackage: e.target.checked }
                                    : item
                                )
                              )
                            }
                          />
                          <span>Include in customer download package</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Uploading & Verifying Files...'
                      : editingProductId
                      ? 'Save Design Changes'
                      : status === 'published'
                      ? 'Upload & Publish Design'
                      : 'Save Design Package'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* TAB 3: ORDERS & DOWNLOADS                                        */}
      {/* ================================================================ */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Marketplace Orders & Signed Download Tokens</h3>
            <span className="text-[11px] text-slate-500">Demo Checkout Mode</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No orders recorded yet. Real orders appear here once customers purchase published designs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((o) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                      <span>{o.id}</span>
                      <span className="text-slate-400 font-normal">
                        ({new Date(o.createdAt).toLocaleDateString()})
                      </span>
                      {o.isDemoOrder && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-sans">
                          Demo Order
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {o.customerName} ({o.customerEmail}) · {o.customerCountry}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Items: {o.items.map((i) => i.productTitle).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      ${o.total.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-emerald-600 font-medium">{o.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: CUSTOM REQUESTS                                           */}
      {/* ================================================================ */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Custom Design Client Leads</h3>
          </div>

          {customRequests.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No custom design briefs submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customRequests.map((req) => (
                <div key={req.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{req.name}</span>
                      <span className="text-slate-400 text-xs ml-2 font-mono">#{req.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">{req.budget}</span>
                      <select
                        value={req.status}
                        onChange={(e) =>
                          updateCustomRequestStatus(
                            req.id,
                            e.target.value as 'Pending' | 'In Review' | 'Quoted' | 'In Progress' | 'Completed'
                          )
                        }
                        className="p-1 border rounded bg-white text-xs font-semibold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Quoted">Quoted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {req.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                    <span>
                      Contact: <strong>{req.email}</strong> · <strong>{req.phone}</strong>
                    </span>
                    <span>
                      Type: <strong>{req.designType}</strong>
                    </span>
                    <span>
                      Deadline: <strong>{req.deadline}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 5: DESIGNER SUBMISSIONS                                      */}
      {/* ================================================================ */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Contributor Submission Queue</h3>
          </div>

          {designerSubmissions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No independent designer submissions in the queue yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {designerSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex items-center justify-center">
                      {sub.previewUrl ? (
                        <img src={sub.previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{sub.title}</h4>
                      <p className="text-slate-500 text-[11px]">
                        By {sub.designerName} · {sub.category} · ${sub.price.toFixed(2)}
                      </p>
                      <span className="inline-block mt-0.5 font-semibold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Status: {sub.status}
                      </span>
                    </div>
                  </div>

                  {sub.status === 'Pending Review' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDesignerSubmissionStatus(sub.id, 'Approved', 'Approved by Graphics Expert.')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateDesignerSubmissionStatus(sub.id, 'Rejected', 'Needs print bleed adjustments.')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 6: COUPONS & PROMOS                                          */}
      {/* ================================================================ */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs items-start">
          <form onSubmit={handleCreateCoupon} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Create Promo Code
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. LAUNCH20"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Value *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Order ($)</label>
                <input
                  type="number"
                  min="0"
                  value={newCouponMinOrder}
                  onChange={(e) => setNewCouponMinOrder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newCouponExpiry}
                  onChange={(e) => setNewCouponExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-semibold"
            >
              Create Coupon
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900">
              Active Coupons ({coupons.length})
            </div>
            {coupons.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No promo coupons created yet. Use the form on the left to add one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900">{c.code}</span>
                      <p className="text-[11px] text-slate-500">
                        {c.discountType === 'percentage' ? `${c.value}% off` : `$${c.value} off`} · Min order ${c.minOrder} · Expires {c.expiry}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCoupon(c.id)}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 7: STORAGE & ENVIRONMENT STATUS                              */}
      {/* ================================================================ */}
      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Persistent Digital File Storage
            </h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Active Storage Provider</span>
                <span className="font-mono font-bold text-slate-900 uppercase">
                  {storageStatus?.provider || 'local'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Private Source Directory</span>
                <span className="font-mono text-slate-900">
                  {storageStatus?.privateStoragePath || 'storage/private/designs'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Public Preview Directory</span>
                <span className="font-mono text-slate-900">
                  {storageStatus?.publicPreviewPath || 'storage/public/previews'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Max File Upload Size</span>
                <span className="font-mono font-bold text-slate-900">
                  {maxUploadMb} MB
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>S3 / Cloudflare R2 Bucket</span>
                <span className="font-semibold text-slate-900">
                  {storageStatus?.s3Configured ? 'Configured' : 'Not configured (using persistent disk)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Production Integration Notes
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Original editable files (.CDR, .AI, .PSD, .EPS, .PSB, .ZIP) are stored outside public static directories and delivered only via HMAC-signed, expiring download tokens after server-side order verification.
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-semibold">Checkout & Cloud Storage Deployment:</p>
              <p>
                Orders currently run in <strong>Demo Checkout Mode</strong>. Configure <code>ADMIN_PASSWORD</code>, <code>SESSION_SECRET</code>, <code>DOWNLOAD_TOKEN_SECRET</code>, and optional <code>S3_*</code> / payment gateway variables in your server environment before production launch.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
