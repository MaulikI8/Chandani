import type { CarpetColour, RoomId } from './types.ts';

export type SlotId = 'sofa' | 'carpet' | 'side-table' | 'dining-table' | 'dining-chair' | 'bed' | 'lamp' | 'wardrobe' | 'kitchen';
export type Variant = { id: string; productId: string | null; label: string };
export type RoomSlot = { id: SlotId; label: string; variants: Variant[]; defaultVariant: string };
const piece = (id: SlotId, label: string, productId: string, name: string): RoomSlot => ({
  id, label, variants: [{ id: productId, productId, label: name }], defaultVariant: productId,
});

/** Real sample selections only. No invented sofa models or unsupported removal combinations. */
export const roomSlots: Record<RoomId, RoomSlot[]> = {
  living: [
    piece('sofa', 'Sofa', 'sofa', 'Haven / Sofa'),
    { id: 'carpet', label: 'Carpet', defaultVariant: 'chalk', variants: [
      ...(['clay', 'chalk', 'ink'] as CarpetColour[]).map(id => ({ id, productId: id, label: `Frame / ${id[0].toUpperCase()}${id.slice(1)}` })),
      { id: 'bare', productId: null, label: 'Bare floor' },
    ] },
    piece('side-table', 'Side table', 'side-table', 'Plinth / Side table'),
  ],
  dining: [piece('dining-table', 'Dining table', 'dining-table', 'Arc / Dining table'), piece('dining-chair', 'Dining chairs', 'dining-chair', 'Line / Dining chair')],
  bedroom: [piece('bed', 'Bed', 'bed', 'Rest / Upholstered bed'), piece('lamp', 'Table light', 'lamp', 'Halo / Table light'), piece('wardrobe', 'Wardrobe', 'wardrobe', 'Form / Wardrobe')],
  kitchen: [{ id: 'kitchen', label: 'Kitchen', defaultVariant: 'concept', variants: [{ id: 'concept', productId: null, label: 'Kitchen design concept' }] }],
};
