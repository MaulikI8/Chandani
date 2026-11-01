export type RoomId = 'living' | 'dining' | 'bedroom' | 'kitchen';
export type CarpetColour = 'clay' | 'chalk' | 'ink';
export type Light = 'day' | 'evening';
export type CategoryId = 'seating' | 'carpets' | 'dining' | 'bedroom' | 'lighting' | 'storage';
export type ProductDimensions = {
  width: string;
  depth: string;
  height: string;
  seatHeight?: string;
  clearance?: string;
  weight?: string;
};
export type ProductGalleryItem = {
  src: string;
  label: string;
  alt: string;
};
export type Product = {
  id: string; name: string; category: CategoryId; type: string; image: string;
  palette: string; text: string; scene: RoomId; featured?: boolean; focus?: string;
  priceNpr?: number;
  nepaliName?: string;
  dimensions?: ProductDimensions;
  materialsList?: string[];
  finishDetails?: string;
  careInstructions?: string[];
  availability?: string;
  deliveryInfo?: string;
  galleryImages?: ProductGalleryItem[];
  relatedIds?: string[];
};
export type Hotspot = { x: number; y: number; label: string } & (
  { product: string; id?: never; title?: never; text?: never; interest?: never } |
  { product?: never; id: string; title: string; text: string; interest: string }
);
export type Room = { label: string; number: string; image: string; alt: string; items: Hotspot[] };
export type ComparisonItem = {
  id: string; split?: number; label: string; product?: string; before: string; after: string;
  ratio: number; withLabel: string; withoutLabel: string; colours?: boolean; interest?: string;
};
export type ComparisonRoom = { label: string; items: ComparisonItem[] };
export type AtelierSettings = {
  atelier_name?: string;
  atelier_name_nepali?: string;
  tagline?: string;
  phone_primary?: string;
  whatsapp_number?: string;
  email?: string;
  address_showroom?: string;
  address_workshop?: string;
  currency_symbol?: string;
  currency_code?: string;
  trade_discount_percent?: number;
  announcement_text?: string;
};
export type CatalogueContent = {
  products: Product[];
  rooms: Record<RoomId, Room>;
  comparisons: Record<RoomId, ComparisonRoom>;
  settings?: AtelierSettings;
};

