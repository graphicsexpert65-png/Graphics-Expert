import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CartItem,
  Category,
  Coupon,
  CustomDesignRequest,
  DesignerSubmission,
  LicenseType,
  Order,
  OrderItem,
  Product,
  ProductStatus,
  StorageConfigStatus,
  User,
  UserRole,
  ViewState,
} from '../types';
import { CATEGORIES } from '../data/mockData';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  authToken: string | null;
  switchRole: (role: 'guest' | 'customer' | 'designer' | 'admin') => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    country: string;
    role?: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  refreshMarketplace: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  storageStatus: StorageConfigStatus | null;
  categories: Category[];
  cart: CartItem[];
  addToCart: (product: Product, license?: LicenseType) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  orders: Order[];
  createOrder: (details: {
    customerName: string;
    customerEmail: string;
    customerCountry: string;
    paymentMethod: string;
  }) => Promise<Order | null>;
  coupons: Coupon[];
  createCoupon: (coupon: Omit<Coupon, 'id' | 'active'>) => Promise<boolean>;
  deleteCoupon: (id: string) => Promise<void>;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  customRequests: CustomDesignRequest[];
  addCustomRequest: (request: Omit<CustomDesignRequest, 'id' | 'createdAt' | 'status'>) => Promise<string | null>;
  updateCustomRequestStatus: (id: string, status: CustomDesignRequest['status']) => Promise<void>;
  designerSubmissions: DesignerSubmission[];
  addDesignerSubmission: (submission: Omit<DesignerSubmission, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  updateDesignerSubmissionStatus: (id: string, status: DesignerSubmission['status'], reviewNote?: string) => Promise<void>;
  uploadNewDesign: (formData: FormData) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateAdminDesign: (id: string, formData: FormData) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  duplicateProduct: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: Toast[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup' | 'forgot';
  openAuthModal: (tab?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  downloadDigitalAsset: (orderId: string, item: OrderItem, fileId?: string, fileName?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'ge_auth_token';
const WISHLIST_STORAGE_KEY = 'ge_wishlist';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentViewState] = useState<ViewState>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [storageStatus, setStorageStatus] = useState<StorageConfigStatus | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [customRequests, setCustomRequests] = useState<CustomDesignRequest[]>([]);
  const [designerSubmissions, setDesignerSubmissions] = useState<DesignerSubmission[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login');

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      return fetch(url, { ...options, headers });
    },
    [authToken]
  );

  const refreshMarketplace = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const refreshAdminData = useCallback(async () => {
    if (!authToken) return;
    try {
      const [prodRes, cpnRes, reqRes, stRes, subRes, ordRes] = await Promise.all([
        authFetch('/api/admin/products'),
        authFetch('/api/admin/coupons'),
        authFetch('/api/custom-requests'),
        authFetch('/api/storage-status'),
        authFetch('/api/designer-submissions'),
        authFetch('/api/orders'),
      ]);
      if (prodRes.ok) {
        const d = await prodRes.json();
        setAdminProducts(d.products || []);
      }
      if (cpnRes.ok) {
        const d = await cpnRes.json();
        setCoupons(d.coupons || []);
      }
      if (reqRes.ok) {
        const d = await reqRes.json();
        setCustomRequests(d.customRequests || []);
      }
      if (stRes.ok) {
        const d = await stRes.json();
        setStorageStatus(d);
      }
      if (subRes.ok) {
        const d = await subRes.json();
        setDesignerSubmissions(d.submissions || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [authToken, authFetch]);

  // Initial load: fetch published products + verify session if token stored
  useEffect(() => {
    refreshMarketplace();
  }, [refreshMarketplace]);

  useEffect(() => {
    let active = true;
    const syncSession = async () => {
      if (!authToken) {
        setCurrentUser(null);
        setOrders([]);
        setAdminProducts([]);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (active) {
            setAuthToken(null);
            setCurrentUser(null);
          }
          return;
        }
        const data = await res.json();
        if (!active) return;
        setCurrentUser(data.user);

        // Fetch user orders
        const ordRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (ordRes.ok && active) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders || []);
        }
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
    if (currentUser?.role === 'admin') {
      refreshAdminData();
    } else if (currentUser?.role === 'designer' && authToken) {
      authFetch('/api/designer-submissions')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.submissions) setDesignerSubmissions(d.submissions);
        })
        .catch(() => {});
    }
  }, [currentUser, authToken, authFetch, refreshAdminData]);

  // Dynamic category counts derived from real published products
  const dynamicCategories = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      templateCount: products.filter((p) => p.status === 'published' && p.categoryId === cat.id).length,
    }));
  }, [products]);

  const setCurrentView = (
    view: ViewState,
    params?: { productId?: string; categoryId?: string; toolId?: string }
  ) => {
    setCurrentViewState(view);
    if (params?.productId !== undefined) setSelectedProductId(params.productId);
    if (params?.categoryId !== undefined) setSelectedCategoryId(params.categoryId);
    if (params?.toolId !== undefined) setActiveToolId(params.toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistSession = (token: string, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setCurrentUser(user);
  };

  const switchRole = async (role: 'guest' | 'customer' | 'designer' | 'admin') => {
    if (role === 'guest') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthToken(null);
      setCurrentUser(null);
      setOrders([]);
      addToast('Guest Mode Active', 'Browse published designs and use free creative tools.', 'info');
      return;
    }
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Switch Failed', data.error || 'Could not switch role.', 'error');
        return;
      }
      persistSession(data.token, data.user);
      addToast(`Signed in as ${data.user.name}`, `Active role: ${data.user.role.toUpperCase()}`, 'success');
    } catch {
      addToast('Connection Error', 'Could not reach Graphics Expert server.', 'error');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials.' };
      }
      persistSession(data.token, data.user);
      setIsAuthModalOpen(false);
      addToast(`Welcome back, ${data.user.name}`, 'Signed in to Graphics Expert.', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Network error while signing in.' };
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    country: string;
    role?: UserRole;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      persistSession(data.token, data.user);
      setIsAuthModalOpen(false);
      addToast(`Welcome, ${data.user.name}`, 'Your Graphics Expert account is active.', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during registration.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setCurrentUser(null);
    setOrders([]);
    setAdminProducts([]);
    addToast('Signed Out', 'You have been safely signed out.', 'info');
    if (currentView === 'dashboard' || currentView === 'designer-dashboard' || currentView === 'admin-dashboard') {
      setCurrentView('home');
    }
  };

  const openAuthModal = (tab: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Cart operations
  const addToCart = (product: Product, license: LicenseType = 'Commercial') => {
    const existing = cart.find((item) => item.product.id === product.id && item.license === license);
    if (existing) {
      addToast('Already in Cart', `"${product.title}" (${license}) is already in your bag.`, 'info');
      return;
    }
    const itemPrice = product.discountPrice ?? product.price;
    const finalPrice = license === 'Extended Commercial' ? itemPrice * 2.5 : itemPrice;
    setCart((prev) => [...prev, { product, license, price: Number(finalPrice.toFixed(2)) }]);
    addToast('Added to Cart', `"${product.title}" added to your bag.`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('Removed from Cart', 'Item removed from your bag.', 'info');
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = Number(cart.reduce((sum, item) => sum + item.price, 0).toFixed(2));

  let cartDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      cartDiscount = Number(((cartSubtotal * appliedCoupon.value) / 100).toFixed(2));
    } else {
      cartDiscount = Math.min(appliedCoupon.value, cartSubtotal);
    }
  }

  const cartTotal = Number(Math.max(0, cartSubtotal - cartDiscount).toFixed(2));

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(code.trim())}&subtotal=${cartSubtotal}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Invalid coupon code.' };
      }
      setAppliedCoupon(data.coupon);
      addToast('Coupon Applied!', `Discount code ${data.coupon.code} applied.`, 'success');
      return { success: true, message: `Coupon ${data.coupon.code} applied!` };
    } catch {
      return { success: false, message: 'Failed to validate coupon.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('Coupon Removed', 'Discount removed from total.', 'info');
  };

  const createCoupon = async (coupon: Omit<Coupon, 'id' | 'active'>) => {
    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Coupon Error', data.error || 'Could not create coupon.', 'error');
        return false;
      }
      setCoupons((prev) => [data.coupon, ...prev]);
      addToast('Coupon Created', `Code ${data.coupon.code} is now active.`, 'success');
      return true;
    } catch {
      return false;
    }
  };

  const deleteCoupon = async (id: string) => {
    const res = await authFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      addToast('Coupon Removed', 'Promo code deleted.', 'info');
    }
  };

  // Wishlist persisted in localStorage
  const toggleWishlist = (productId: string) => {
    if (!currentUser) {
      addToast('Sign In Required', 'Please sign in to save designs to your wishlist.', 'info');
      openAuthModal('login');
      return;
    }
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      addToast(
        exists ? 'Removed from Wishlist' : 'Saved to Wishlist',
        exists ? 'Item removed from wishlist.' : 'Design added to your wishlist.',
        exists ? 'info' : 'success'
      );
      return next;
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // Server-backed Order Creation
  const createOrder = async (details: {
    customerName: string;
    customerEmail: string;
    customerCountry: string;
    paymentMethod: string;
  }) => {
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          couponCode: appliedCoupon?.code,
          items: cart.map((c) => ({ productId: c.product.id, license: c.license })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Order Error', data.error || 'Checkout could not be completed.', 'error');
        return null;
      }
      const createdOrder: Order = data.order;
      setOrders((prev) => [createdOrder, ...prev]);
      clearCart();
      setAppliedCoupon(null);
      return createdOrder;
    } catch {
      addToast('Checkout Failed', 'Unable to connect to order server.', 'error');
      return null;
    }
  };

  // Real Server-Authorized Binary Download (streams original CDR/AI/PSD/EPS/ZIP or ZIP package)
  const downloadDigitalAsset = async (
    orderId: string,
    item: OrderItem,
    fileId?: string,
    fileName?: string
  ) => {
    try {
      addToast('Preparing Secure Download', `Verifying purchase token for ${fileName || item.productTitle}...`, 'info');
      let token = item.downloadToken;

      const buildUrl = (t: string) =>
        `/api/downloads/${encodeURIComponent(orderId)}/${encodeURIComponent(item.id)}?token=${encodeURIComponent(t)}${
          fileId ? `&fileId=${encodeURIComponent(fileId)}` : ''
        }`;

      let res = await authFetch(buildUrl(token));

      // If token expired and user is logged in, refresh token from server
      if (res.status === 401 && authToken) {
        const refreshRes = await authFetch(
          `/api/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(item.id)}/refresh-token`,
          { method: 'POST' }
        );
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          token = refreshData.downloadToken;
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    items: o.items.map((it) =>
                      it.id === item.id
                        ? { ...it, downloadToken: token, downloadExpiresAt: refreshData.downloadExpiresAt }
                        : it
                    ),
                  }
                : o
            )
          );
          res = await authFetch(buildUrl(token));
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download authorization denied.' }));
        addToast('Download Blocked', err.error || 'Purchase verification failed.', 'error');
        return;
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const downloadFilename =
        match?.[1] || fileName || `${item.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-package.zip`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Download Complete', `Saved ${downloadFilename}`, 'success');
      refreshMarketplace();
    } catch (err) {
      console.error('Download error:', err);
      addToast('Download Error', 'Failed to download design package.', 'error');
    }
  };

  // Custom Design Requests
  const addCustomRequest = async (
    request: Omit<CustomDesignRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    try {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Submission Failed', data.error || 'Could not submit request.', 'error');
        return null;
      }
      setCustomRequests((prev) => [data.customRequest, ...prev]);
      addToast('Request Submitted!', `Your request #${data.customRequest.id} was sent to Graphics Expert.`, 'success');
      return data.customRequest.id as string;
    } catch {
      addToast(
        'Online request service unavailable',
        'This Cloudflare Pages deployment has no connected request API. Your form details remain on screen; use the email option shown below to send the brief.',
        'error'
      );
      return null;
    }
  };

  const updateCustomRequestStatus = async (id: string, status: CustomDesignRequest['status']) => {
    const res = await authFetch(`/api/admin/custom-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setCustomRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)));
      addToast('Status Updated', `Request #${id} marked as ${status}.`, 'info');
    }
  };

  // Designer submissions
  const addDesignerSubmission = async (
    submission: Omit<DesignerSubmission, 'id' | 'submittedAt' | 'status'>
  ) => {
    const res = await authFetch('/api/designer-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (res.ok) {
      const data = await res.json();
      setDesignerSubmissions((prev) => [data.submission, ...prev]);
      addToast('Template Submitted!', 'Your submission has been queued for Graphics Expert review.', 'success');
    } else {
      addToast('Sign In Required', 'Please sign in as a Designer to submit.', 'error');
    }
  };

  const updateDesignerSubmissionStatus = async (
    id: string,
    status: DesignerSubmission['status'],
    reviewNote?: string
  ) => {
    const res = await authFetch(`/api/admin/designer-submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote }),
    });
    if (res.ok) {
      setDesignerSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status, reviewNote } : sub))
      );
      addToast('Submission Updated', `Submission #${id} marked as ${status}.`, 'info');
    }
  };

  // Admin Upload & Product Management
  const uploadNewDesign = async (formData: FormData) => {
    try {
      const res = await authFetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Upload failed.' };
      }
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast(
        'Design Uploaded!',
        `"${data.product.title}" saved (${data.product.status.toUpperCase()}).`,
        'success'
      );
      return { success: true, product: data.product };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error during upload.' };
    }
  };

  const updateAdminDesign = async (id: string, formData: FormData) => {
    try {
      const res = await authFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Update failed.' };
      }
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Design Updated!', `"${data.product.title}" changes saved.`, 'success');
      return { success: true, product: data.product };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error updating design.' };
    }
  };

  const updateProductStatus = async (id: string, status: ProductStatus) => {
    const res = await authFetch(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Status Changed', `Design is now ${status.toUpperCase()}.`, 'success');
    }
  };

  const duplicateProduct = async (id: string) => {
    const res = await authFetch(`/api/admin/products/${id}/duplicate`, {
      method: 'POST',
    });
    if (res.ok) {
      await refreshAdminData();
      addToast('Design Duplicated', 'A draft copy with cloned files was created.', 'success');
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await authFetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await Promise.all([refreshAdminData(), refreshMarketplace()]);
      addToast('Design Deleted', 'Design and its private files were removed.', 'info');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authToken,
        switchRole,
        login,
        register,
        logout,
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
        refreshMarketplace,
        refreshAdminData,
        storageStatus,
        categories: dynamicCategories,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartSubtotal,
        cartDiscount,
        wishlist,
        toggleWishlist,
        isWishlisted,
        orders,
        createOrder,
        coupons,
        createCoupon,
        deleteCoupon,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        customRequests,
        addCustomRequest,
        updateCustomRequestStatus,
        designerSubmissions,
        addDesignerSubmission,
        updateDesignerSubmissionStatus,
        uploadNewDesign,
        updateAdminDesign,
        updateProductStatus,
        duplicateProduct,
        deleteProduct,
        searchQuery,
        setSearchQuery,
        toasts,
        addToast,
        removeToast,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        downloadDigitalAsset,
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
