export interface SeoOptions {
  title: string;
  description: string;
  /** Path portion of the canonical URL, e.g. "/marketplace". */
  path: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown> | null;
}

const SITE_NAME = 'Graphics Expert';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo(opts: SeoOptions): void {
  const origin = window.location.origin;
  const url = origin + opts.path;
  const image = opts.image ? (opts.image.startsWith('http') ? opts.image : origin + opts.image) : '';

  document.title = opts.title;
  setMeta('name', 'description', opts.description);
  setMeta('name', 'robots', opts.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  setLink('canonical', url);

  setMeta('property', 'og:title', opts.title);
  setMeta('property', 'og:description', opts.description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', opts.type === 'product' ? 'product' : 'website');
  setMeta('property', 'og:site_name', SITE_NAME);
  if (image) setMeta('property', 'og:image', image);

  setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', opts.title);
  setMeta('name', 'twitter:description', opts.description);
  if (image) setMeta('name', 'twitter:image', image);

  const existing = document.getElementById('page-jsonld');
  if (existing) existing.remove();
  if (opts.jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-jsonld';
    script.textContent = JSON.stringify(opts.jsonLd);
    document.head.appendChild(script);
  }
}

export const PAGE_SEO: Record<string, { title: string; description: string }> = {
  home: {
    title: 'Graphics Expert | Editable CorelDRAW, Illustrator & Print Design Files',
    description:
      'Download original editable CorelDRAW, Adobe Illustrator and Photoshop design files, use free browser design tools, and order custom logo, banner and print design from Graphics Expert.',
  },
  marketplace: {
    title: 'Design Marketplace | Editable CDR, AI & PSD Files | Graphics Expert',
    description:
      'Browse original editable design files for wedding cards, business cards, menus, panaflex banners, flyers and more. Free and premium print-ready designs.',
  },
  tools: {
    title: 'Free Design Tools | Image Resizer, Compressor & Converter | Graphics Expert',
    description:
      'Free browser-based design tools: resize and compress images, convert formats, turn images into PDF, check print sizes and social media dimensions. Files never leave your device.',
  },
  'custom-design': {
    title: 'Graphic Design Services | Logo, Banner & Print Design | Graphics Expert',
    description:
      'Custom logo design, business cards, panaflex and flex banners, social media designs, packaging and print-ready artwork. Send a design brief and get a quote.',
  },
  about: {
    title: 'About Graphics Expert | Professional Graphic Design Studio',
    description:
      'Graphics Expert is a graphic design studio creating original CorelDRAW, Illustrator and Photoshop files and custom print design for businesses.',
  },
  contact: {
    title: 'Contact Graphics Expert | Design Enquiries & Support',
    description: 'Get in touch with Graphics Expert for design files, custom work, quotes and support.',
  },
  faq: {
    title: 'FAQ | Graphics Expert',
    description: 'Answers about design files, formats, licenses, downloads and custom design orders at Graphics Expert.',
  },
  licenses: {
    title: 'License Information | Graphics Expert',
    description: 'Understand the Personal, Commercial and Extended Commercial licenses for Graphics Expert design files.',
  },
};
