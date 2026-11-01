import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { asset, formatNPR } from '../data/service';
import { Icon } from './Icon';

interface CollectionStory {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  story: string;
  palette: string;
  pieces: Array<{
    id: string;
    name: string;
    category: string;
    priceNPR: number;
  }>;
}

const collections: CollectionStory[] = [
  {
    id: 'neutral-sanctuary',
    title: 'The Warm Neutral Residence',
    subtitle: 'Quiet textures, grounded timber, and luminous natural wool',
    image: 'room-chalk.webp',
    palette: 'Ivory Bouclé · American Walnut · Chalk Wool',
    story:
      'Designed around natural Himalayan daylight and architectural calm. The Haven sofa in soft ivory bouclé provides cloud-like depth, anchored by an 80-knot chalk Tibetan wool carpet with delicate stepped borders. Solid walnut accents add necessary earth and shadow.',
    pieces: [
      { id: 'sofa', name: 'Haven / Sofa', category: 'Seating', priceNPR: 320000 },
      { id: 'chalk', name: 'Frame / Chalk', category: 'Carpets', priceNPR: 175000 },
      { id: 'side-table', name: 'Kanso / Coffee Table', category: 'Living', priceNPR: 95000 },
      { id: 'lamp', name: 'Halo / Table Light', category: 'Lighting', priceNPR: 38000 },
    ],
  },
  {
    id: 'heritage-earth',
    title: 'The Mineral Heritage Sanctuary',
    subtitle: 'Warm terracotta tones, native Sisau hardwood, and artisanal shadow',
    image: 'room-clay.webp',
    palette: 'Terracotta Earth · Solid Sisau · Patinated Brass',
    story:
      'A celebration of natural mineral pigments and native Valley timber. The Frame Clay carpet provides an immediate thermal anchor to the room, dyed with organic madder root and mineral washes. Pairs with deep auburn Sisau joinery that matures in richness with touch and age.',
    pieces: [
      { id: 'clay', name: 'Frame / Clay', category: 'Carpets', priceNPR: 180000 },
      { id: 'sofa', name: 'Haven / Sofa (Terracotta pairing)', category: 'Seating', priceNPR: 320000 },
      { id: 'side-table', name: 'Solid Sisau Side Table', category: 'Living', priceNPR: 48000 },
    ],
  },
  {
    id: 'evening-dining',
    title: 'Evening Dining & Entertaining Suite',
    subtitle: 'Quarter-sawn oak, sculpted seating, and generous clearance',
    image: 'dining.webp',
    palette: 'European White Oak · Oatmeal Linen · Charcoal Accent',
    story:
      'Engineered for long, comfortable dinner conversations. The Arc table features solid quarter-sawn white oak with eased bullnose contours, surrounded by ergonomic curved dining chairs that tuck cleanly under the apron. Proportioned to leave minimum 75cm pushback clearance.',
    pieces: [
      { id: 'dining-table', name: 'Arc / Dining Table', category: 'Dining', priceNPR: 240000 },
      { id: 'ink', name: 'Frame / Ink Carpet', category: 'Carpets', priceNPR: 185000 },
      { id: 'wardrobe', name: 'Form / Credenza Sideboard', category: 'Storage', priceNPR: 285000 },
    ],
  },
];

export function CuratedCollections() {
  const { openProduct, openEnquiry } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const current = collections[activeTab];

  const totalNPR = current.pieces.reduce((sum, p) => sum + p.priceNPR, 0);

  return (
    <section className="curated-collections showroom-extension section" id="curatedCollections">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CURATED RESIDENCES</span>
          <h2>Harmonious living, conceived as a whole.</h2>
        </div>
        <p>
          We do not believe in isolated furniture cards. Each Chandani collection is a cohesive spatial study combining upholstery, hand-knotted weaving, and master joinery.
        </p>
      </div>

      {/* Collection Navigation Tabs */}
      <div className="collection-tabs-bar" role="tablist" aria-label="Curated collections">
        {collections.map((col, idx) => (
          <button
            key={col.id}
            type="button"
            role="tab"
            aria-selected={activeTab === idx}
            className={`collection-nav-tab${activeTab === idx ? ' active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            <span className="tab-number">0{idx + 1}</span>
            <span className="tab-title">{col.title}</span>
          </button>
        ))}
      </div>

      {/* Main Editorial Presentation */}
      <div className="collection-editorial-card">
        <div className="editorial-visual-frame">
          <img src={asset(current.image)} alt={current.title} loading="lazy" />
          <div className="visual-overlay-caption">
            <span className="eyebrow">PALETTE SPECIFICATION</span>
            <strong>{current.palette}</strong>
          </div>
        </div>

        <div className="editorial-story-content">
          <div className="story-header">
            <span className="eyebrow">COLLECTION 0{activeTab + 1}</span>
            <h3>{current.title}</h3>
            <p className="story-subtitle">{current.subtitle}</p>
          </div>

          <p className="story-body">{current.story}</p>

          <div className="story-shoppable-pieces">
            <span className="eyebrow">INCLUDED IN THIS COMPOSITION</span>
            <div className="pieces-list">
              {current.pieces.map((piece) => (
                <div key={piece.id} className="piece-row">
                  <div className="piece-meta">
                    <strong>{piece.name}</strong>
                    <span className="piece-cat">{piece.category}</span>
                  </div>
                  <div className="piece-actions">
                    <span className="piece-price">{formatNPR(piece.priceNPR)}</span>
                    <button
                      type="button"
                      className="text-link-small"
                      onClick={() => openProduct(piece.id)}
                      aria-label={`Explore ${piece.name}`}
                    >
                      Details ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="editorial-actions-row">
            <div className="ensemble-pricing">
              <span>Full Ensemble Total</span>
              <strong>{formatNPR(totalNPR)}</strong>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => openEnquiry(`Curated Collection - ${current.title}`, 'private', `Interested in commissioning the complete ${current.title} suite (Estimate: ${formatNPR(totalNPR)}).`)}
            >
              Enquire on this collection <Icon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CuratedCollections;
