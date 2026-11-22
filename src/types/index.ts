export type UserRole = 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
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
  /** Only present in admin responses. */
  views?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  templateCount: number;
}

export type DesignRequestStatus = 'Pending' | 'In Review' | 'Quoted' | 'In Progress' | 'Completed';

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
  hasReferenceFile?: boolean;
  status: DesignRequestStatus;
  createdAt: string;
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

export interface AdminStats {
  published: number;
  drafts: number;
  categories: number;
  totalViews: number;
  pendingBriefs: number;
  recentUploads: Array<{ id: string; title: string; status: ProductStatus; createdAt: string }>;
  recentBriefs: CustomDesignRequest[];
}

export type ViewState =
  | 'home'
  | 'marketplace'
  | 'product-detail'
  | 'tools'
  | 'custom-design'
  | 'admin-dashboard'
  | 'about'
  | 'contact'
  | 'faq'
  | 'licenses';
