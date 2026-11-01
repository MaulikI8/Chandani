import { sampleComparisons, sampleProducts, sampleRooms } from './sample.ts';
import type { CatalogueContent, Product } from './types';

/** The only content transport boundary. Replace this adapter with fetch when an API exists. */
export interface CatalogueService {
  loadContent(signal?: AbortSignal): Promise<CatalogueContent>;
}
const API_URL = (endpoint: string) => {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `http://127.0.0.1:8000${endpoint}`;
  }
  return endpoint;
};

export const localCatalogueService: CatalogueService = {
  async loadContent(signal) {
    signal?.throwIfAborted();
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch(API_URL('/api/catalogue/'), { signal });
        if (res.ok) {
          const remote = await res.json();
          if (remote?.products?.length && remote?.rooms && remote?.comparisons) {
            return structuredClone({
              products: remote.products,
              rooms: remote.rooms,
              comparisons: remote.comparisons,
              settings: remote.settings,
            });
          }
        }
      } catch {
        // Fallback to embedded catalogue if backend is starting
      }
    }
    return structuredClone({ products: sampleProducts, rooms: sampleRooms, comparisons: sampleComparisons });
  },
};

export function formatNpr(amount?: number): string {
  if (amount === undefined || amount === null) return '';
  return `रू ${amount.toLocaleString('en-IN')}`;
}
export const formatNPR = formatNpr;

export async function submitEnquiryToDjango(payload: Record<string, unknown>): Promise<boolean> {
  if (typeof fetch !== 'function') return false;
  try {
    const res = await fetch(API_URL('/api/enquiries/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function searchCatalogue(products: Product[], query: string) {
  const term = query.trim().toLocaleLowerCase();
  return {
    products: products.filter(p => `${p.name} ${p.category} ${p.type} ${p.palette}`.toLocaleLowerCase().includes(term)),
    kitchen: !term || 'kitchen design layout storage cabinetry'.includes(term),
  };
}
export const asset = (name: string) => `/assets/${name}`;

