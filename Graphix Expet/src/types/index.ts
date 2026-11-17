export type UserRole = 'customer' | 'designer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  country: string;
  bio?: string;
  balance?: number;
  totalSales?: number;
  joinedDate: string;
}

export type FileFormat =
  | 'CDR'
  | 'AI'
  | 'EPS'
  | 'PSD'
  | 'PSB'
  | 'PDF'
  | 'PNG'
  | 'JPG'
  | 'JPEG'
  | 'TIF'
  | 'TIFF'
  | 'ZIP'
  | 'SVG'
  | 'Canva';

export type LicenseType = 'Personal' | 'Commercial' | 'Extended Commercial';

export type ProductStatus = 'published' | 'draft' | 'unpublished';

export interface DesignFileAsset {
  id: string;
  displayName: string;
  originalFileName: string;
  format: FileFormat;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  softwareCompatibility: string;
  supportedVersion: string;
  includedInPackage: boolean;
  uploadedAt: string;
  sha256?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  designerId: string;
  designerName: string;
  price: number;
  discountPrice?: number;
  previewUrl: string;
  galleryImages: string[];
  fileFormats: FileFormat[];
  files: DesignFileAsset[];
  dimensions: string;
  colorMode: 'CMYK' | 'RGB';
  dpi: number;
  softwareCompatibility: string[];
  isEditable: boolean;
  license: LicenseType;
  featured: boolean;
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  whatsIncluded: string[];
  howToEdit: string[];
  status: ProductStatus;
  fileDownloadSize: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  templateCount: number;
}

export interface CartItem {
  product: Product;
  license: LicenseType;
  price: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productThumbnail: string;
  price: number;
  license: LicenseType;
  downloadToken: string;
  downloadExpiresAt: string;
  files?: DesignFileAsset[];
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerCountry: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  isDemoOrder?: boolean;
  createdAt: string;
}

export interface CustomDesignRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  designType: string;
  requiredSize: string;
  description: string;
  deadline: string;
  budget: string;
  referenceFileName?: string;
  status: 'Pending' | 'In Review' | 'Quoted' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface DesignerSubmission {
  id: string;
  designerId: string;
  designerName: string;
  title: string;
  category: string;
  price: number;
  fileFormats: FileFormat[];
  dimensions: string;
  status: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected';
  reviewNote?: string;
  previewUrl: string;
  submittedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiry: string;
  minOrder: number;
  active: boolean;
}

export interface StorageConfigStatus {
  provider: string;
  maxUploadSizeMb: number;
  privateStoragePath: string;
  publicPreviewPath: string;
  persistentDiskActive: boolean;
  demoCheckoutEnabled: boolean;
  s3Configured: boolean;
}

export type ViewState =
  | 'home'
  | 'marketplace'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'dashboard'
  | 'tools'
  | 'custom-design'
  | 'pricing'
  | 'become-designer'
  | 'designer-dashboard'
  | 'admin-dashboard'
  | 'about'
  | 'contact'
  | 'faq'
  | 'licenses';
