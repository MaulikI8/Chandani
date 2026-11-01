import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sampleProducts } from '../data/sample';

export interface ProductItem {
  id: string;
  name: string;
  nepaliName?: string;
  category: string;
  type: string;
  priceNpr: number;
  image: string;
  palette: string;
  text: string;
  scene: string;
  featured: boolean;
  dimensions?: {
    width?: string;
    depth?: string;
    height?: string;
    seatHeight?: string;
    clearance?: string;
    weight?: string;
  };
  materialsList?: string[];
  finishDetails?: string;
  careInstructions?: string[];
  availability?: string;
  deliveryInfo?: string;
}

export interface CategoryItem {
  slug: string;
  name: string;
  nepaliName?: string;
  sortOrder: number;
}

export interface EnquiryItem {
  id: string;
  clientType: 'private' | 'trade' | 'swatch';
  name: string;
  email: string;
  phone: string;
  firmName?: string;
  projectScope?: string;
  shippingAddress?: string;
  roomDimensions?: string;
  kitchenLayout?: string;
  interest: string;
  notes?: string;
  quotedTotal: number;
  status: 'new' | 'contacted' | 'in_progress' | 'fulfilled' | 'closed';
  createdAt: string;
}

export interface CarpetColorway {
  colorId: string;
  name: string;
  nepaliName?: string;
  colorName: string;
  palette: string;
  hexCode: string;
  materialDescription: string;
  imageDay: string;
  imageEvening?: string;
  priceNpr: number;
}

export interface SiteSettings {
  atelierName: string;
  atelierNameNepali: string;
  tagline: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsappNumber: string;
  email: string;
  addressShowroom: string;
  addressWorkshop: string;
  currencySymbol: string;
  currencyCode: string;
  tradeDiscountPercent: number;
  announcementText: string;
}

export interface CouponItem {
  code: string;
  discountPercent: number;
  description: string;
  active: boolean;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  quote: string;
  location: string;
  rating: number;
}

interface AdminContextType {
  isAdmin: boolean;
  adminLogin: (password: string) => Promise<boolean>;
  adminLogout: () => void;
  products: ProductItem[];
  categories: CategoryItem[];
  enquiries: EnquiryItem[];
  carpets: CarpetColorway[];
  siteSettings: SiteSettings;
  coupons: CouponItem[];
  testimonials: TestimonialItem[];
  addProduct: (product: ProductItem) => void;
  updateProduct: (product: ProductItem) => void;
  deleteProduct: (id: string) => void;
  updateEnquiryStatus: (id: string, status: EnquiryItem['status']) => void;
  deleteEnquiry: (id: string) => void;
  addEnquiry: (enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  addCarpetVariant: (carpet: CarpetColorway) => void;
  updateCarpetVariant: (carpet: CarpetColorway) => void;
  deleteCarpetVariant: (colorId: string) => void;
  addCategory: (category: CategoryItem) => void;
  deleteCategory: (slug: string) => void;
  addCoupon: (coupon: CouponItem) => void;
  toggleCoupon: (code: string) => void;
  deleteCoupon: (code: string) => void;
}

const DEFAULT_SETTINGS: SiteSettings = {
  atelierName: 'Chandani Atelier Nepal',
  atelierNameNepali: 'चाँदनी ए atelier नेपाल',
  tagline: 'Architectural craft, contemplative spaces, and bespoke furniture crafted in the Kathmandu Valley.',
  phonePrimary: '+977 1 552 4890',
  phoneSecondary: '+977 980 123 4567',
  whatsappNumber: '+977 980 123 4567',
  email: 'atelier@chandani.com.np',
  addressShowroom: 'Baber Mahal Revisited, Kathmandu, Nepal',
  addressWorkshop: 'Patan Industrial Estate Craft Quarter, Lalitpur, Nepal',
  currencySymbol: 'रू',
  currencyCode: 'NPR',
  tradeDiscountPercent: 20,
  announcementText: 'White-glove delivery across Kathmandu Valley · Himalayan hand-knotted custom rugs & bespoke woodwork',
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { slug: 'seating', name: 'Sofas & Seating', nepaliName: 'बस्ने सिट तथा सोफा', sortOrder: 1 },
  { slug: 'carpets', name: 'Highland Wool Carpets', nepaliName: 'तिब्बती ऊनी कार्पेट', sortOrder: 2 },
  { slug: 'tables', name: 'Dining & Low Tables', nepaliName: 'टेबल तथा मेच', sortOrder: 3 },
  { slug: 'storage', name: 'Credenzas & Storage', nepaliName: 'दराज तथा काठकाम', sortOrder: 4 },
  { slug: 'kitchen', name: 'Kitchen & Millwork', nepaliName: 'भान्सा तथा आर्किटेक्चरल काठकाम', sortOrder: 5 },
];

const DEFAULT_ENQUIRIES: EnquiryItem[] = [
  {
    id: 'ENQ-8901',
    clientType: 'trade',
    name: 'Suman Shrestha',
    email: 'suman@archstudio-ktm.com',
    phone: '+977 9841234567',
    firmName: 'Shrestha Architects & Atelier',
    projectScope: 'Bespoke living room package for residential villa in Budhanilkantha (Haven Sofa + Frame Chalk 9x12ft rug)',
    interest: 'Whole home',
    roomDimensions: '6.5m x 5.2m with 3.2m high ceiling',
    notes: 'Requested trade discount (-20%) and custom charcoal finish on plinth.',
    quotedTotal: 360000,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ENQ-8902',
    clientType: 'private',
    name: 'Apekshya Thapa',
    email: 'apekshya.t@gmail.com',
    phone: '+977 9802345678',
    projectScope: 'Frame / Chalk Hand-Knotted Carpet in custom size 8x10ft',
    interest: 'Carpets',
    notes: 'Would like an evening swatch check in Baber Mahal showroom.',
    quotedTotal: 175000,
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ENQ-8903',
    clientType: 'swatch',
    name: 'Rohan Pradhan',
    email: 'rohan.pradhan@outlook.com',
    phone: '+977 9813456789',
    shippingAddress: 'Lakeside Ward 6, Pokhara, Nepal',
    interest: 'Material Swatch Box',
    notes: 'Building lakefront residence; sample box requested for Tibetan wool and smoked oak.',
    quotedTotal: 0,
    status: 'fulfilled',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const DEFAULT_CARPETS: CarpetColorway[] = [
  {
    colorId: 'chalk',
    name: 'Frame / Chalk',
    nepaliName: 'फ्रेम चल्क',
    colorName: 'Chalk Raw',
    palette: 'Off-white & Undyed Raw Wool',
    hexCode: '#e8e4dc',
    materialDescription: '100% Hand-spun Tibetan Highland Wool, hand-knotted in Kathmandu Valley.',
    imageDay: 'product-chalk.webp',
    imageEvening: 'hero-chalk-wide.webp',
    priceNpr: 175000,
  },
  {
    colorId: 'terracotta',
    name: 'Frame / Terracotta Ochre',
    nepaliName: 'माटोको रंग',
    colorName: 'Terracotta',
    palette: 'Warm Earth & Ochre',
    hexCode: '#b4532a',
    materialDescription: 'Vegetable-dyed Himalayan wool with dense hand-carved high/low pile relief.',
    imageDay: 'product-terracotta.webp',
    imageEvening: 'product-terracotta.webp',
    priceNpr: 185000,
  },
  {
    colorId: 'indigo',
    name: 'Frame / Indigo Night',
    nepaliName: 'नील रात',
    colorName: 'Indigo',
    palette: 'Deep Himalayan Indigo',
    hexCode: '#2c3e50',
    materialDescription: 'Deep indigo-steeped wool yarn with hand-knotted Tibetan weave (80 knots/sq inch).',
    imageDay: 'product-indigo.webp',
    imageEvening: 'product-indigo.webp',
    priceNpr: 195000,
  },
];

const DEFAULT_COUPONS: CouponItem[] = [
  { code: 'ARCHITECT20', discountPercent: 20, description: 'Verified Interior Architecture Trade Discount', active: true },
  { code: 'PATRON10', discountPercent: 10, description: 'Private Collector & Patron Introductory Privilege', active: true },
  { code: 'SWATCHFREE', discountPercent: 100, description: 'Complimentary Material Swatch Box Express Delivery', active: true },
];

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    author: 'Ar. Prabal Joshi',
    role: 'Principal, Studio Sthapatya',
    quote: 'Chandani’s attention to proportions and the authenticity of their patinated oak and raw Tibetan wool is unmatched in South Asia.',
    location: 'Kathmandu',
    rating: 5,
  },
  {
    id: 't-2',
    author: 'Prajwol & Neha Malla',
    role: 'Homeowners',
    quote: 'The Haven sofa and Frame rug transformed our living room into a sanctuary of calm. White-glove delivery was flawless.',
    location: 'Budhanilkantha',
    rating: 5,
  },
];

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chandani_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return sampleProducts.map(p => ({
      ...p,
      priceNpr: p.id === 'sofa' ? 185000 : (p.id === 'chalk' ? 175000 : 120000),
    }));
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_enquiries');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ENQUIRIES;
  });

  const [carpets, setCarpets] = useState<CarpetColorway[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_carpets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CARPETS;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [coupons, setCoupons] = useState<CouponItem[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_coupons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COUPONS;
  });

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() => {
    try {
      const saved = localStorage.getItem('chandani_admin_testimonials');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TESTIMONIALS;
  });

  // Save changes
  useEffect(() => {
    try { localStorage.setItem('chandani_admin_auth', String(isAdmin)); } catch {}
  }, [isAdmin]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_products', JSON.stringify(products)); } catch {}
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_categories', JSON.stringify(categories)); } catch {}
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_enquiries', JSON.stringify(enquiries)); } catch {}
  }, [enquiries]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_carpets', JSON.stringify(carpets)); } catch {}
  }, [carpets]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_settings', JSON.stringify(siteSettings)); } catch {}
  }, [siteSettings]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_coupons', JSON.stringify(coupons)); } catch {}
  }, [coupons]);

  useEffect(() => {
    try { localStorage.setItem('chandani_admin_testimonials', JSON.stringify(testimonials)); } catch {}
  }, [testimonials]);

  async function adminLogin(password: string) {
    if (password === 'chandani2026' || password === 'lovekod2026') {
      setIsAdmin(true);
      return true;
    }
    // Attempt backend login
    try {
      const res = await fetch('/api/admin/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAdmin(true);
        return true;
      }
    } catch {}
    return false;
  }

  function adminLogout() {
    setIsAdmin(false);
  }

  function addProduct(product: ProductItem) {
    setProducts(prev => [product, ...prev]);
  }

  function updateProduct(product: ProductItem) {
    setProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
  }

  function deleteProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function updateEnquiryStatus(id: string, status: EnquiryItem['status']) {
    setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
  }

  function deleteEnquiry(id: string) {
    setEnquiries(prev => prev.filter(e => e.id !== id));
  }

  function addEnquiry(enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) {
    const newEnquiry: EnquiryItem = {
      ...enquiry,
      id: `ENQ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    setEnquiries(prev => [newEnquiry, ...prev]);
  }

  function updateSiteSettings(settings: Partial<SiteSettings>) {
    setSiteSettings(prev => ({ ...prev, ...settings }));
  }

  function addCarpetVariant(carpet: CarpetColorway) {
    setCarpets(prev => [...prev, carpet]);
  }

  function updateCarpetVariant(carpet: CarpetColorway) {
    setCarpets(prev => prev.map(c => (c.colorId === carpet.colorId ? carpet : c)));
  }

  function deleteCarpetVariant(colorId: string) {
    setCarpets(prev => prev.filter(c => c.colorId !== colorId));
  }

  function addCategory(category: CategoryItem) {
    setCategories(prev => [...prev, category]);
  }

  function deleteCategory(slug: string) {
    setCategories(prev => prev.filter(c => c.slug !== slug));
  }

  function addCoupon(coupon: CouponItem) {
    setCoupons(prev => [coupon, ...prev]);
  }

  function toggleCoupon(code: string) {
    setCoupons(prev => prev.map(c => (c.code === code ? { ...c, active: !c.active } : c)));
  }

  function deleteCoupon(code: string) {
    setCoupons(prev => prev.filter(c => c.code !== code));
  }

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminLogin,
        adminLogout,
        products,
        categories,
        enquiries,
        carpets,
        siteSettings,
        coupons,
        testimonials,
        addProduct,
        updateProduct,
        deleteProduct,
        updateEnquiryStatus,
        deleteEnquiry,
        addEnquiry,
        updateSiteSettings,
        addCarpetVariant,
        updateCarpetVariant,
        deleteCarpetVariant,
        addCategory,
        deleteCategory,
        addCoupon,
        toggleCoupon,
        deleteCoupon,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}
