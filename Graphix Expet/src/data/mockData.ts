import {
  Product,
  Category,
  Coupon,
  CustomDesignRequest,
  DesignerSubmission,
  Order,
  Review,
  User,
} from '../types';

export const DEMO_USERS: Record<string, User> = {
  customer: {
    id: 'usr_cust_01',
    name: 'Customer Account',
    email: 'customer@graphicsexpert.com',
    role: 'customer',
    country: 'Pakistan',
    joinedDate: 'Nov 2026',
  },
  designer: {
    id: 'usr_des_02',
    name: 'Contributor Studio',
    email: 'designer@graphicsexpert.com',
    role: 'designer',
    country: 'Pakistan',
    bio: 'Independent print and vector template contributor.',
    balance: 0,
    totalSales: 0,
    joinedDate: 'Nov 2026',
  },
  admin: {
    id: 'usr_adm_owner',
    name: 'Graphics Expert (Owner)',
    email: 'graphicsexpert65@gmail.com',
    role: 'admin',
    country: 'Pakistan',
    joinedDate: 'Nov 2026',
  },
};

export const CATEGORIES: Category[] = [
  {
    id: 'coreldraw-designs',
    name: 'CorelDRAW Designs',
    slug: 'coreldraw-designs',
    description: 'Native editable .CDR vector layouts, print press curves, and multi-layer templates.',
    iconName: 'PenTool',
    templateCount: 0,
  },
  {
    id: 'illustrator-designs',
    name: 'Adobe Illustrator Designs',
    slug: 'illustrator-designs',
    description: 'Clean scalable .AI vector artwork, logos, packaging, and print stationery.',
    iconName: 'Layers',
    templateCount: 0,
  },
  {
    id: 'photoshop-templates',
    name: 'Photoshop Templates',
    slug: 'photoshop-templates',
    description: 'High-resolution layered .PSD and .PSB files with smart object placeholders.',
    iconName: 'Image',
    templateCount: 0,
  },
  {
    id: 'eps-vector-designs',
    name: 'EPS Vector Designs',
    slug: 'eps-vector-designs',
    description: 'Cross-compatible .EPS vector illustrations, badges, and ornamental frames.',
    iconName: 'Sparkles',
    templateCount: 0,
  },
  {
    id: 'business-cards',
    name: 'Business Cards',
    slug: 'business-cards',
    description: 'Single and double-sided visiting cards with spot UV and cutting bleed marks.',
    iconName: 'CreditCard',
    templateCount: 0,
  },
  {
    id: 'wedding-nikkah-cards',
    name: 'Wedding & Nikkah Cards',
    slug: 'wedding-nikkah-cards',
    description: 'Royal Shadi, Walima, and Nikkah invitations with laser die-cut and foil layers.',
    iconName: 'HeartHandshake',
    templateCount: 0,
  },
  {
    id: 'restaurant-menus',
    name: 'Restaurant Menus',
    slug: 'restaurant-menus',
    description: 'Bi-fold, tri-fold, tabletop, and digital board food & cafe menu templates.',
    iconName: 'UtensilsCrossed',
    templateCount: 0,
  },
  {
    id: 'panaflex-flex-banners',
    name: 'Panaflex & Flex Banners',
    slug: 'panaflex-flex-banners',
    description: 'Wide-format shop boards, outdoor hoardings, and frontlit/backlit flex banners.',
    iconName: 'Flag',
    templateCount: 0,
  },
  {
    id: 'rollup-standee-designs',
    name: 'Roll-up Standee Designs',
    slug: 'rollup-standee-designs',
    description: '2.5×6 ft and 3×6 ft exhibition standees and retail promotional displays.',
    iconName: 'Maximize2',
    templateCount: 0,
  },
  {
    id: 'flyers-posters',
    name: 'Flyers & Posters',
    slug: 'flyers-posters',
    description: 'Promotional handbills, event posters, A4/A5 flyers, and sale leaflets.',
    iconName: 'FileText',
    templateCount: 0,
  },
  {
    id: 'bill-books',
    name: 'Bill Books',
    slug: 'bill-books',
    description: 'Invoice pads, cash memos, receipt books, and commercial challan layouts.',
    iconName: 'Receipt',
    templateCount: 0,
  },
  {
    id: 'brochures',
    name: 'Brochures',
    slug: 'brochures',
    description: 'Company profiles, bi-fold, tri-fold, and multi-page corporate catalogs.',
    iconName: 'BookOpen',
    templateCount: 0,
  },
  {
    id: 'islamic-designs',
    name: 'Islamic Designs',
    slug: 'islamic-designs',
    description: 'Ramadan calendars, Eid Mubarak cards, Jalsa banners, and Arabic calligraphy.',
    iconName: 'Moon',
    templateCount: 0,
  },
  {
    id: 'social-media-designs',
    name: 'Social Media Designs',
    slug: 'social-media-designs',
    description: 'Instagram posts, Facebook ads, YouTube thumbnails, and WhatsApp promos.',
    iconName: 'Share2',
    templateCount: 0,
  },
];

// All dummy products, fake orders, fake reviews, and fake submissions removed.
// Real designs are uploaded and persisted via the Admin Upload System.
export const PRODUCTS: Product[] = [];
export const INITIAL_COUPONS: Coupon[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_CUSTOM_REQUESTS: CustomDesignRequest[] = [];
export const INITIAL_DESIGNER_SUBMISSIONS: DesignerSubmission[] = [];
export const MOCK_REVIEWS: Review[] = [];
