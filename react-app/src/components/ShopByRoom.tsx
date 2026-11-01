import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { asset, formatNPR } from '../data/service';
import type { RoomId } from '../data/types';
import { Icon } from './Icon';

interface RoomEditorial {
  id: RoomId;
  name: string;
  tagline: string;
  image: string;
  description: string;
  architecturalNote: string;
  products: Array<{
    id: string;
    name: string;
    role: string;
    priceNPR: number;
    image: string;
  }>;
}

const roomEditorials: RoomEditorial[] = [
  {
    id: 'living',
    name: 'Living Room Sanctuary',
    tagline: 'Quiet comfort, acoustic calm, and enduring proportions',
    image: 'hero-chalk-wide.webp',
    description:
      'The heart of the residential experience. Low-slung seating allows sightlines to flow uninterrupted, while a hand-knotted 80-knot wool carpet dampens ambient echo in open-plan spaces.',
    architecturalNote:
      'Recommended minimum ceiling clearance: 2.7 m. Allow 90 cm circulation clearance around the primary seating perimeter.',
    products: [
      { id: 'sofa', name: 'Haven / Sofa', role: 'Primary Anchor', priceNPR: 320000, image: 'sofa.webp' },
      { id: 'chalk', name: 'Frame / Chalk Carpet', role: 'Foundation', priceNPR: 175000, image: 'product-chalk.webp' },
      { id: 'side-table', name: 'Kanso / Coffee Table', role: 'Joinery', priceNPR: 95000, image: 'without-lamp.webp' },
    ],
  },
  {
    id: 'dining',
    name: 'Dining Sanctuary',
    tagline: 'Quarter-sawn oak, comfortable seating, and generous clearance',
    image: 'dining.webp',
    description:
      'Where conversations linger long after dinner concludes. Built with solid white oak seasoned specifically to withstand Himalayan seasonal humidity transitions.',
    architecturalNote:
      'Ensure minimum 75 cm chair pushback clearance from walls and 90 cm adjacent to sideboards or entryways.',
    products: [
      { id: 'dining-table', name: 'Arc / Dining Table', role: 'Solid Oak Centerpiece', priceNPR: 240000, image: 'without-dining-chairs.webp' },
      { id: 'ink', name: 'Frame / Ink Carpet', role: 'Perimeter Foundation', priceNPR: 185000, image: 'product-ink.webp' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom Retreat',
    tagline: 'Tactile linen, low timber frames, and mindful restful scale',
    image: 'bedroom.webp',
    description:
      'A sanctuary designed for unhurried evenings and morning light. American walnut and breathable Belgian linen foster natural circadian calm.',
    architecturalNote:
      'Leave 65–75 cm on either side of the bed for nightstand access and effortless linen changes.',
    products: [
      { id: 'bed', name: 'Rest / Upholstered Bed', role: 'King Bedstead', priceNPR: 295000, image: 'bedroom.webp' },
      { id: 'wardrobe', name: 'Form / Wardrobe', role: 'Architectural Storage', priceNPR: 285000, image: 'without-lamp.webp' },
      { id: 'lamp', name: 'Halo / Table Light', role: 'Ambient Glow', priceNPR: 38000, image: 'without-wardrobe.webp' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Gathering',
    tagline: 'Custom walnut cabinetry, honed stone, and ergonomic flow',
    image: 'kitchen.webp',
    description:
      'The modern hearth. Designed to combine high-performance culinary preparation with welcoming social breakfast seating.',
    architecturalNote:
      'Work triangle (hob to sink to refrigerator) perimeter kept within the ergonomic 4.0 m to 7.0 m standard.',
    products: [
      { id: 'kitchen', name: 'Chandani Kitchen Study', role: 'Custom Cabinetry & Island', priceNPR: 850000, image: 'kitchen.webp' },
    ],
  },
];

export function ShopByRoom() {
  const { openProduct, openTry, openEnquiry } = useApp();
  const [activeRoomId, setActiveRoomId] = useState<RoomId>('living');
  const current = roomEditorials.find((r) => r.id === activeRoomId) ?? roomEditorials[0];

  return (
    <section className="shop-by-room showroom-extension section" id="shopByRoom">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FOUR SPATIAL WORLDS</span>
          <h2>Shop by Room</h2>
        </div>
        <p>
          Select a room to explore complete furnished scenes, recommended proportions, and identifiable Chandani pieces.
        </p>
      </div>

      <div className="room-nav-pills" role="tablist" aria-label="Select room editorial">
        {roomEditorials.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={activeRoomId === r.id}
            className={`room-pill${activeRoomId === r.id ? ' active' : ''}`}
            onClick={() => setActiveRoomId(r.id)}
          >
            {r.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="room-editorial-display">
        <div className="room-display-photo">
          <img src={asset(current.image)} alt={current.name} loading="lazy" />
          <div className="photo-corner-badge">
            <span className="eyebrow">ARCHITECTURAL GUIDANCE</span>
            <p>{current.architecturalNote}</p>
          </div>
        </div>

        <div className="room-display-info">
          <div className="info-header">
            <span className="eyebrow">{current.id.toUpperCase()} ENVIRONMENT</span>
            <h3>{current.name}</h3>
            <p className="tagline">{current.tagline}</p>
            <p className="description">{current.description}</p>
          </div>

          <div className="room-featured-products">
            <span className="eyebrow">IDENTIFIABLE PIECES IN THIS ROOM</span>
            <div className="room-products-grid">
              {current.products.map((prod) => (
                <div key={prod.id} className="room-prod-card">
                  <div className="prod-thumb">
                    <img src={asset(prod.image)} alt={prod.name} loading="lazy" />
                  </div>
                  <div className="prod-details">
                    <strong>{prod.name}</strong>
                    <span className="prod-role">{prod.role}</span>
                    <span className="prod-price">{formatNPR(prod.priceNPR)}</span>
                    <button
                      type="button"
                      className="text-link-small"
                      onClick={() => openProduct(prod.id)}
                    >
                      View specifications ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="room-cta-row">
            <button
              type="button"
              className="button"
              onClick={() => openTry(current.products[0]?.id, current.id)}
            >
              Experience in Try the Room <Icon />
            </button>
            <button
              type="button"
              className="button outline"
              onClick={() => openEnquiry(`${current.name} Design Consultation`, 'private')}
            >
              Consult on this room
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopByRoom;
