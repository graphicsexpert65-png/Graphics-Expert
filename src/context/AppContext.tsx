import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AdminStats,
  Category,
  CustomDesignRequest,
  DesignRequestStatus,
  Product,
  ProductStatus,
  StorageConfigStatus,
  User,
  ViewState,
} from '../types';
import { FALLBACK_CATEGORIES } from '../data/mockData';
import { PAGE_SEO, applySeo } from '../seo';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export interface DesignBriefInput {
  name: string;
  email: string;
  phone: string;
  designType: string;
  requiredSize: string;
  description: string;
  deadline: string;
  budget: string;
  referenceFile?: File | null;
}

interface AppContextType {
  currentUser: User | null;
  authToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  currentView: ViewState;
  setCurrentView: (view: ViewState, params?: { productId?: string; categoryId?: string; toolId?: string }) => void;
  selectedProductId: string | null;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  activeToolId: string | null;
  setActiveToolId: (id: string | null) => void;
  products: Product[];
  adminProducts: Product[];
  isLoadingProducts: boolean;
  productsError: string | null;
  refreshMarketplace: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  storageStatus: StorageConfigStatus | null;
  adminStats: AdminStats | null;
  categories: Category[];
  createCategory: (input: { name: string; description: string; iconName: string }) => Promise<boolean>;
  updateCategory: (id: string, input: { name: string; description: string; iconName: string }) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  customRequests: CustomDesignRequest[];
  addCustomRequest: (brief: DesignBriefInput) => Promise<{ id: string | null; error?: string }>;
  updateCustomRequestStatus: (id: string, status: DesignRequestStatus) => Promise<void>;
  deleteCustomRequest: (id: string) => Promise<void>;
  downloadBriefReference: (id: string, fileName?: string) => Promise<void>;
  uploadNewDesign: (formData: FormData) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateAdminDesign: (id: string, formData: FormData) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  duplicateProduct: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  downloadFreeFile: (product: Product, fileId: string, fileName: string) => Promise<void>;
  downloadAdminFile: (productId: string, fileId: string, fileName: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: Toast[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'ge_auth_token';

// ---------------------------------------------------------------------------
// URL <-> view mapping (real, crawlable URLs for every public page)
// ---------------------------------------------------------------------------

const VIEW_PATHS: Record<Exclude<ViewState, 'product-detail'>, string> = {
  home: '/',
  marketplace: '/marketplace',
  tools: '/tools',
  'custom-design': '/services',
  'admin-dashboard': '/admin',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  licenses: '/licenses',
};

interface RouteState {
  view: ViewState;
  productRef: string | null;
  categoryId: string | null;
}

function parsePath(pathname: string): RouteState {
  const path = pathname.replace(/\/+$/, '') || '/';
  const design = path.match(/^\/design\/([^/]+)$/);
  if (design) return { view: 'product-detail', productRef: decodeURIComponent(design[1]), categoryId: null };
  const category = path.match(/^\/category\/([^/]+)$/);
  if (category) return { view: 'marketplace', productRef: null, categoryId: decodeURIComponent(category[1]) };
  for (const [view, p] of Object.entries(VIEW_PATHS)) {
    if (p === path) return { view: view as ViewState, productRef: null, categoryId: null };
  }
  return { view: 'home', productRef: null, categoryId: null };
}

export function buildPath(view: ViewState, productRef: string | null, categoryId: string | null): string {
  if (view === 'product-detail' && productRef) return `/design/${encodeURIComponent(productRef)}`;
  if (view === 'marketplace' && categoryId) return `/category/${encodeURIComponent(categoryId)}`;
  if (view === 'product-detail') return '/marketplace';
  return VIEW_PATHS[view];
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    // body was not JSON
  }
  return `${fallback} (server responded ${res.status})`;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRoute = useMemo(() => parsePath(window.location.pathname), []);

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentViewState] = useState<ViewState>(initialRoute.view);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productRef);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialRoute.categoryId);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageConfigStatus | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [apiCategories, setApiCategories] = useState<Category[] | null>(null);
  const [customRequests, setCustomRequests] = useState<CustomDesignRequest[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 && authToken) {
        // Session expired: drop it so the owner is asked to sign in again.
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // ignore
        }
        setAuthToken(null);
        setCurrentUser(null);
      }
      return res;
    },
    [authToken]
  );

  // ----- public data -----

  const refreshMarketplace = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const [prodRes, catRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
        setProductsError(null);
      } else {
        setProductsError(await readError(prodRes, 'Designs could not be loaded'));
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setApiCategories(data.categories || []);
      }
    } catch {
      setProductsError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshMarketplace();
  }, [refreshMarketplace]);

  const categories = useMemo<Category[]>(() => {
    if (apiCategories) return apiCategories;
    return FALLBACK_CATEGORIES;
  }, [apiCategories]);

  // ----- admin data -----

  const refreshAdminData = useCallback(async () => {
    if (!authToken) return;
    try {
      const [prodRes, reqRes, stRes, statsRes] = await Promise.all([
        authFetch('/api/admin/products'),
        authFetch('/api/custom-requests'),
        authFetch('/api/storage-status'),
        authFetch('/api/admin/stats'),
      ]);
      if (prodRes.ok) setAdminProducts((await prodRes.json()).products || []);
      if (reqRes.ok) setCustomRequests((await reqRes.json()).customRequests || []);
      if (stRes.ok) setStorageStatus(await stRes.json());
      if (statsRes.ok) setAdminStats((await statsRes.json()).stats || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [authToken, authFetch]);

  useEffect(() => {
    let active = true;
    const syncSession = async () => {
      if (!authToken) {
        setCurrentUser(null);
        setAdminProducts([]);
        setCustomRequests([]);
        setAdminStats(null);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } });
        if (!active) return;
        if (!res.ok) {
          if (res.status === 401) {
            try {
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            } catch {
              // ignore
            }
            setAuthToken(null);
          }
          setCurrentUser(null);
          return;
        }
        setCurrentUser((await res.json()).user);
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };
    syncSession();
    return () => {
      active = false;
    };
  }, [authToken]);

  useEffect(() => {
    if (currentUser?.role === 'admin') refreshAdminData();
  }, [currentUser, refreshAdminData]);

  // ----- navigation -----

  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;

  const setCurrentView = useCallback(
    (view: ViewState, params?: { productId?: string; categoryId?: string; toolId?: string }) => {
      let productRef = params?.productId !== undefined ? params.productId : null;
      if (view === 'product-detail' && productRef) {
        const found = productsRef.current.find((p) => p.id === productRef || p.slug === productRef);
        if (found) productRef = found.slug;
      }
      const categoryId = view === 'marketplace' ? (params?.categoryId ?? null) : null;

      setCurrentViewState(view);
      setSelectedProductId(view === 'product-detail' ? productRef : null);
      setSelectedCategoryId(view === 'marketplace' ? categoryId : params?.categoryId ?? null);
      if (params?.toolId !== undefined) setActiveToolId(params.toolId);

      const path = buildPath(view, productRef, categoryId);
      if (window.location.pathname !== path) window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  useEffect(() => {
    const onPop = () => {
      const route = parsePath(window.location.pathname);
      setCurrentViewState(route.view);
      setSelectedProductId(route.productRef);
      setSelectedCategoryId(route.categoryId);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ----- SEO (title, description, canonical, Open Graph, JSON-LD) -----

  useEffect(() => {
    if (currentView === 'admin-dashboard') {
      applySeo({ title: 'Admin | Graphics Expert', description: 'Private area.', path: '/admin', noindex: true });
      return;
    }
    if (currentView === 'product-detail') {
      const product = products.find((p) => p.id === selectedProductId || p.slug === selectedProductId);
      if (product) {
        const price = product.discountPrice ?? product.price;
        applySeo({
          title: `${product.title} | ${product.categoryName} | Graphics Expert`,
          description: (product.shortDescription || product.description).slice(0, 158),
          path: `/design/${product.slug}`,
          image: product.previewUrl,
          type: 'product',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.shortDescription || product.description,
            image: product.previewUrl ? [window.location.origin + product.previewUrl] : undefined,
            category: product.categoryName,
            brand: { '@type': 'Brand', name: 'Graphics Expert' },
            offers: {
              '@type': 'Offer',
              price: price.toFixed(2),
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${window.location.origin}/design/${product.slug}`,
            },
          },
        });
      } else {
        applySeo({
          title: isLoadingProducts ? 'Loading design | Graphics Expert' : 'Design not found | Graphics Expert',
          description: 'This design is not available.',
          path: window.location.pathname,
          noindex: !isLoadingProducts,
        });
      }
      return;
    }
    if (currentView === 'marketplace' && selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId);
      if (category) {
        applySeo({
          title: `${category.name} | Editable Design Files | Graphics Expert`,
          description: category.description,
          path: `/category/${category.id}`,
        });
        return;
      }
    }
    const seo = PAGE_SEO[currentView] || PAGE_SEO.home;
    const path = VIEW_PATHS[currentView as Exclude<ViewState, 'product-detail'>] || '/';
    applySeo({
      ...seo,
      path,
      jsonLd:
        currentView === 'home'
          ? {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Graphics Expert',
              url: window.location.origin,
              description: PAGE_SEO.home.description,
            }
          : null,
    });
  }, [currentView, selectedProductId, selectedCategoryId, products, categories, isLoadingProducts]);

  // ----- auth -----

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return { success: false, error: await readError(res, 'Sign-in failed') };
      const data = await res.json();
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // storage unavailable: session lasts until reload
      }
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setIsAuthModalOpen(false);
      addToast('Signed in', 'Welcome back to the Graphics Expert admin.', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please check your connection.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthToken(null);
    setCurrentUser(null);
    setAdminProducts([]);
    setCustomRequests([]);
    setAdminStats(null);
    addToast('Signed out', 'You have been signed out.', 'info');
    if (currentView === 'admin-dashboard') setCurrentView('home');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await authFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) return { success: false, error: await readError(res, 'Could not update the password') };
      addToast('Password updated', 'Your owner password has been changed.', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please check your connection.' };
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // ----- downloads -----

  const downloadFreeFile = async (product: Product, fileId: string, fileName: string) => {
    try {
      addToast('Preparing download', fileName, 'info');
      const res = await fetch(`/api/downloads/${encodeURIComponent(product.id)}/${encodeURIComponent(fileId)}`);
      if (!res.ok) {
        addToast('Download unavailable', await readError(res, 'The file could not be downloaded'), 'error');
        return;
      }
      saveBlob(await res.blob(), fileName);
      addToast('Download complete', `Saved ${fileName}`, 'success');
    } catch {
      addToast('Download failed', 'Could not reach the server. Please try again.', 'error');
    }
  };

  const downloadAdminFile = async (productId: string, fileId: string, fileName: string) => {
    try {
      const res = await authFetch(
        `/api/admin/products/${encodeURIComponent(productId)}/files/${encodeURIComponent(fileId)}/download`
      );
      if (!res.ok) {
        addToast('Download failed', await readError(res, 'The file could not be downloaded'), 'error');
        return;
      }
      saveBlob(await res.blob(), fileName);
    } catch {
      addToast('Download failed', 'Could not reach the server.', 'error');
    }
  };

  // ----- design briefs -----

  const addCustomRequest = async (brief: DesignBriefInput) => {
    try {
      const form = new FormData();
      form.set('name', brief.name);
      form.set('email', brief.email);
      form.set('phone', brief.phone);
      form.set('designType', brief.designType);
      form.set('requiredSize', brief.requiredSize);
      form.set('description', brief.description);
      form.set('deadline', brief.deadline);
      form.set('budget', brief.budget);
      if (brief.referenceFile) form.set('referenceFile', brief.referenceFile);
      const res = await fetch('/api/custom-requests', { method: 'POST', body: form });
      if (!res.ok) {
        const error = await readError(res, 'Your brief could not be submitted');
        addToast('Submission failed', error, 'error');
        return { id: null, error };
      }
      const data = await res.json();
      return { id: data.customRequest.id as string };
    } catch {
      const error = 'Could not reach the server. Your brief was NOT sent — please check your connection and try again.';
      addToast('Submission failed', error, 'error');
      return { id: null, error };
    }
  };

  const updateCustomRequestStatus = async (id: string, status: DesignRequestStatus) => {
    const res = await authFetch(`/api/admin/custom-requests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setCustomRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      addToast('Status updated', `Brief ${id} is now "${status}".`, 'info');
    } else {
      addToast('Update failed', await readError(res, 'Could not update the brief'), 'error');
    }
  };

  const deleteCustomRequest = async (id: string) => {
    const res = await authFetch(`/api/admin/custom-requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setCustomRequests((prev) => prev.filter((r) => r.id !== id));
      addToast('Brief deleted', `Brief ${id} was removed.`, 'info');
      refreshAdminData();
    } else {
      addToast('Delete failed', await readError(res, 'Could not delete the brief'), 'error');
    }
  };

  const downloadBriefReference = async (id: string, fileName?: string) => {
    const res = await authFetch(`/api/admin/custom-requests/${encodeURIComponent(id)}/reference`);
    if (!res.ok) {
      addToast('Download failed', await readError(res, 'Could not download the reference file'), 'error');
      return;
    }
    saveBlob(await res.blob(), fileName || 'reference');
  };

  // ----- categories -----

  const categoryRequest = async (path: string, method: string, body?: unknown) => {
    const res = await authFetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      addToast('Category error', await readError(res, 'The category could not be saved'), 'error');
      return false;
    }
    await Promise.all([refreshMarketplace(), refreshAdminData()]);
    return true;
  };

  const createCategory = (input: { name: string; description: string; iconName: string }) =>
    categoryRequest('/api/admin/categories', 'POST', input);
  const updateCategory = (id: string, input: { name: string; description: string; iconName: string }) =>
    categoryRequest(`/api/admin/categories/${encodeURIComponent(id)}`, 'PUT', input);
  const deleteCategory = (id: string) => categoryRequest(`/api/admin/categories/${encodeURIComponent(id)}`, 'DELETE');

  // ----- admin design management -----

  const uploadNewDesign = async (formData: FormData) => {
    try {
      const res = await authFetch('/api/admin/products', { method: 'POST', body: formData });
      if (!res.ok) return { success: false, error: await readError(res, 'Upload failed') };
      const data = await res.json();
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Design saved', `"${data.product.title}" saved as ${data.product.status}.`, 'success');
      return { success: true, product: data.product as Product };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error during upload.' };
    }
  };

  const updateAdminDesign = async (id: string, formData: FormData) => {
    try {
      const res = await authFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', body: formData });
      if (!res.ok) return { success: false, error: await readError(res, 'Update failed') };
      const data = await res.json();
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Design updated', `"${data.product.title}" changes saved.`, 'success');
      return { success: true, product: data.product as Product };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error while saving.' };
    }
  };

  const updateProductStatus = async (id: string, status: ProductStatus) => {
    const res = await authFetch(`/api/admin/products/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Status changed', `Design is now ${status}.`, 'success');
    } else {
      addToast('Status not changed', await readError(res, 'Could not change status'), 'error');
    }
  };

  const duplicateProduct = async (id: string) => {
    const res = await authFetch(`/api/admin/products/${encodeURIComponent(id)}/duplicate`, { method: 'POST' });
    if (res.ok) {
      await refreshAdminData();
      addToast('Design duplicated', 'A draft copy was created.', 'success');
    } else {
      addToast('Duplicate failed', await readError(res, 'Could not duplicate the design'), 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await authFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Design deleted', 'The design and its files were removed.', 'info');
    } else {
      addToast('Delete failed', await readError(res, 'Could not delete the design'), 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authToken,
        login,
        logout,
        changePassword,
        currentView,
        setCurrentView,
        selectedProductId,
        selectedCategoryId,
        setSelectedCategoryId,
        activeToolId,
        setActiveToolId,
        products,
        adminProducts,
        isLoadingProducts,
        productsError,
        refreshMarketplace,
        refreshAdminData,
        storageStatus,
        adminStats,
        categories,
        createCategory,
        updateCategory,
        deleteCategory,
        customRequests,
        addCustomRequest,
        updateCustomRequestStatus,
        deleteCustomRequest,
        downloadBriefReference,
        uploadNewDesign,
        updateAdminDesign,
        updateProductStatus,
        duplicateProduct,
        deleteProduct,
        downloadFreeFile,
        downloadAdminFile,
        searchQuery,
        setSearchQuery,
        toasts,
        addToast,
        removeToast,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
