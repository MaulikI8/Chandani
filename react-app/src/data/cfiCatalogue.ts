export type CfiRange = 'comfort' | 'spring' | 'premium' | 'pu' | 'epe-roll' | 'epe-sheet' | 'epe-cushion';

export type CfiProduct = {
  id: string;
  name: string;
  ranges: CfiRange[];
  image?: string;
  description: string;
};

export const rangeLabels: Record<CfiRange, string> = {
  comfort: 'Comfort Series',
  spring: 'Flexible Spring Series',
  premium: 'Premium / Luxury Series',
  pu: 'PU Foam',
  'epe-roll': 'EPE Roll',
  'epe-sheet': 'EPE Sheet',
  'epe-cushion': 'EPE Cushion',
};

// Names and series reflect the company's published catalogue. Specifications,
// availability, and pricing should be confirmed directly with the company.
export const cfiProducts: CfiProduct[] = [
  { id: 'bondwell-pillow-top-2', name: 'Bondwell Pillow Top', ranges: ['premium'], image: 'bondwell-pillow-top-2.webp', description: 'A pillow-top mattress with a bonded foam core, in the Premium / Luxury Series.' },
  { id: 'memory-pillow-top', name: 'Memory Pillow Top', ranges: ['premium'], image: 'memory-pillow-top.webp', description: 'A pillow-top mattress in the Premium / Luxury Series.' },
  { id: 'recharge-pillow-top', name: 'Recharge Pillow Top', ranges: ['premium'], image: 'recharge-pillow-top.webp', description: 'A bonded-foam mattress with a soft pillow-top layer, in the Premium / Luxury Series.' },
  { id: 'unique', name: 'Unique', ranges: ['comfort'], image: 'unique.webp', description: 'A Comfort Series mattress with foam layers and a quilted top.' },
  { id: 'fighter-pillow-top-2', name: 'Fighter Pillow Top 2', ranges: ['comfort'], description: 'A pillow-top mattress from the Comfort Series.' },
  { id: 'fighter', name: 'Fighter', ranges: ['comfort'], image: 'fighter.webp', description: 'A Comfort Series mattress with a foam core and bonded foam layers.' },
  { id: 'fighter-pillow-top', name: 'Fighter Pillow Top', ranges: ['comfort'], image: 'fighter-pillow-top.webp', description: 'A pillow-top mattress from the Comfort Series.' },
  { id: 'memory-mattress', name: 'Memory Mattress', ranges: ['spring', 'premium'], image: 'memory-mattress.webp', description: 'A mattress featuring memory foam, listed in the Flexible Spring and Premium / Luxury Series.' },
  { id: 'pleasure-pillow-top', name: 'Pleasure Pillow Top', ranges: ['spring', 'premium'], image: 'pleasure-pillow-top.webp', description: 'A spring mattress with a pillow-top layer, listed in the Flexible Spring and Premium / Luxury Series.' },
  { id: 'euro-top', name: 'Euro Top', ranges: ['spring'], image: 'euro-top.webp', description: 'A mattress with a quilted Euro-top layer, listed in the Flexible Spring Series.' },
  { id: 'pu-foam', name: 'PU Foam', ranges: ['pu'], image: 'pu-foam.webp', description: 'Polyurethane foam for cushioning and other applications.' },
  { id: 'epe-foam', name: 'EPE Foam Roll', ranges: ['epe-roll'], image: 'epe-foam.webp', description: 'Expanded polyethylene foam supplied in rolls.' },
  { id: 'epe-sheet', name: 'EPE Sheet', ranges: ['epe-sheet'], image: 'epe-sheet.webp', description: 'Expanded polyethylene foam supplied in sheets.' },
  { id: 'epe-cushion', name: 'EPE Cushion', ranges: ['epe-cushion'], image: 'epe-cushion.webp', description: 'Expanded polyethylene foam cushioning for protective applications.' },
];

export function filterCfiProducts(range: CfiRange | 'all', search = ''): CfiProduct[] {
  const term = search.trim().toLocaleLowerCase();
  return cfiProducts.filter(product =>
    (range === 'all' || product.ranges.includes(range)) &&
    (!term || [product.name, product.description, ...product.ranges.map(r => rangeLabels[r])].join(' ').toLocaleLowerCase().includes(term)),
  );
}
