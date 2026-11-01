import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useApp } from '../state/AppContext';
import { asset, formatNPR } from '../data/service';
import { Icon } from './Icon';
import { toast } from 'sonner';

interface CuratedPiece {
  id: string;
  name: string;
  category: string;
  priceNPR: number;
  x: number; // percentage position on image
  y: number;
}

interface CollectionStory {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  story: string;
  palette: string;
  paletteSwatches: Array<{ name: string; hex: string }>;
  pieces: CuratedPiece[];
}

const collections: CollectionStory[] = [
  {
    id: 'neutral-sanctuary',
    title: 'The Warm Neutral Residence',
    subtitle: 'Quiet textures, grounded timber, and luminous natural wool',
    image: 'room-chalk.webp',
    palette: 'Ivory Bouclé · American Walnut · Chalk Wool',
    paletteSwatches: [
      { name: 'Ivory Bouclé', hex: '#ece5db' },
      { name: 'American Walnut', hex: '#483528' },
      { name: 'Chalk Tibetan Wool', hex: '#ded6cb' },
    ],
    story:
      'Designed around natural Himalayan daylight and architectural calm. The Haven sofa in soft ivory bouclé provides cloud-like depth, anchored by an 80-knot chalk Tibetan wool carpet with delicate stepped borders. Solid walnut accents add necessary earth and shadow.',
    pieces: [
      { id: 'sofa', name: 'Haven / Sofa', category: 'Seating', priceNPR: 320000, x: 48, y: 44 },
      { id: 'chalk', name: 'Frame / Chalk', category: 'Carpets', priceNPR: 175000, x: 50, y: 72 },
      { id: 'side-table', name: 'Kanso / Coffee Table', category: 'Living', priceNPR: 95000, x: 80, y: 52 },
      { id: 'lamp', name: 'Halo / Table Light', category: 'Lighting', priceNPR: 38000, x: 18, y: 38 },
    ],
  },
  {
    id: 'heritage-earth',
    title: 'The Mineral Heritage Sanctuary',
    subtitle: 'Warm terracotta tones, native Sisau hardwood, and artisanal shadow',
    image: 'room-clay.webp',
    palette: 'Terracotta Earth · Solid Sisau · Patinated Brass',
    paletteSwatches: [
      { name: 'Terracotta Mineral', hex: '#b3634b' },
      { name: 'Terai Sisau Hardwood', hex: '#5c341f' },
      { name: 'Patinated Brass', hex: '#b89552' },
    ],
    story:
      'A celebration of natural mineral pigments and native Valley timber. The Frame Clay carpet provides an immediate thermal anchor to the room, dyed with organic madder root and mineral washes. Pairs with deep auburn Sisau joinery that matures in richness with touch and age.',
    pieces: [
      { id: 'clay', name: 'Frame / Clay', category: 'Carpets', priceNPR: 180000, x: 48, y: 68 },
      { id: 'sofa', name: 'Haven / Sofa (Terracotta pairing)', category: 'Seating', priceNPR: 320000, x: 45, y: 40 },
      { id: 'side-table', name: 'Solid Sisau Side Table', category: 'Living', priceNPR: 48000, x: 82, y: 52 },
    ],
  },
  {
    id: 'evening-dining',
    title: 'Evening Dining & Entertaining Suite',
    subtitle: 'Quarter-sawn oak, sculpted seating, and generous clearance',
    image: 'dining.webp',
    palette: 'European White Oak · Oatmeal Linen · Charcoal Accent',
    paletteSwatches: [
      { name: 'European White Oak', hex: '#988168' },
      { name: 'Belgian Linen', hex: '#ded7cc' },
      { name: 'Charcoal Patina', hex: '#2c2d30' },
    ],
    story:
      'Engineered for long, comfortable dinner conversations. The Arc table features solid quarter-sawn white oak with eased bullnose contours, surrounded by ergonomic curved dining chairs that tuck cleanly under the apron. Proportioned to leave minimum 75cm pushback clearance.',
    pieces: [
      { id: 'dining-table', name: 'Arc / Dining Table', category: 'Dining', priceNPR: 240000, x: 52, y: 56 },
      { id: 'ink', name: 'Frame / Ink Carpet', category: 'Carpets', priceNPR: 185000, x: 50, y: 80 },
      { id: 'wardrobe', name: 'Form / Credenza Sideboard', category: 'Storage', priceNPR: 285000, x: 20, y: 38 },
    ],
  },
];

export function CuratedCollections() {
  const { openProduct, openEnquiry, toggleSave, saved } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [activePieceId, setActivePieceId] = useState<string | null>(null);
  const current = collections[activeTab];

  const totalNPR = current.pieces.reduce((sum, p) => sum + p.priceNPR, 0);

  const handleSaveWholeCollection = () => {
    let addedCount = 0;
    current.pieces.forEach((p) => {
      if (!saved.includes(p.id)) {
        toggleSave(p.id);
        addedCount++;
      }
    });
    toast.success('Collection Saved to Shortlist', {
      description: `${current.pieces.length} coordinating pieces from ${current.title} added to your shortlist.`,
    });
  };

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
            onClick={() => {
              setActiveTab(idx);
              setActivePieceId(null);
            }}
          >
            <span className="tab-number">0{idx + 1}</span>
            <span className="tab-title">{col.title}</span>
          </button>
        ))}
      </div>

      {/* Main Editorial Presentation */}
      <AnimatePresence mode="wait">
        <m.div
          key={current.id}
          className="collection-editorial-card"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.88, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Visual Frame with Interactive Floating Hotspot Markers */}
          <div className="editorial-visual-frame">
            <img src={asset(current.image)} alt={current.title} loading="lazy" />

            {/* Floating Hotspots on Photo */}
            <div className="collection-photo-hotspots" aria-label="Explore items in this scene">
              {current.pieces.map((piece, pIdx) => {
                const isActive = activePieceId === piece.id;
                return (
                  <div
                    key={piece.id}
                    className={`editorial-hotspot-marker${isActive ? ' active' : ''}`}
                    style={{ left: `${piece.x}%`, top: `${piece.y}%` }}
                    onMouseEnter={() => setActivePieceId(piece.id)}
                    onMouseLeave={() => setActivePieceId(null)}
                  >
                    <button
                      type="button"
                      className="hotspot-trigger-pin"
                      onClick={() => openProduct(piece.id)}
                      aria-label={`Explore ${piece.name} - ${formatNPR(piece.priceNPR)}`}
                    >
                      <span className="pin-pulse" />
                      <span className="pin-num">0{pIdx + 1}</span>
                    </button>
                    <div className="hotspot-preview-card" role="tooltip">
                      <span className="preview-cat">{piece.category}</span>
                      <strong>{piece.name}</strong>
                      <span className="preview-price">{formatNPR(piece.priceNPR)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="visual-overlay-caption">
              <div className="palette-info-block">
                <span className="eyebrow">PALETTE SPECIFICATION</span>
                <strong>{current.palette}</strong>
              </div>
              <div className="palette-swatches-row" aria-hidden="true">
                {current.paletteSwatches.map((swatch, sIdx) => (
                  <span
                    key={sIdx}
                    className="palette-swatch-dot"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Story & Shoppable Breakdown */}
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
                {current.pieces.map((piece, pIdx) => {
                  const isActive = activePieceId === piece.id;
                  return (
                    <div
                      key={piece.id}
                      className={`piece-row${isActive ? ' highlighted' : ''}`}
                      onMouseEnter={() => setActivePieceId(piece.id)}
                      onMouseLeave={() => setActivePieceId(null)}
                    >
                      <div className="piece-meta">
                        <span className="piece-index">0{pIdx + 1}</span>
                        <div>
                          <strong>{piece.name}</strong>
                          <span className="piece-cat">{piece.category}</span>
                        </div>
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
                  );
                })}
              </div>
            </div>

            <div className="editorial-actions-row">
              <div className="ensemble-pricing">
                <span>Full Ensemble Total</span>
                <strong>{formatNPR(totalNPR)}</strong>
              </div>
              <div className="ensemble-buttons-cluster">
                <button
                  type="button"
                  className="button outline"
                  onClick={handleSaveWholeCollection}
                  aria-label="Save entire collection to shortlist"
                >
                  Save collection <Icon name="save" />
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    openEnquiry(
                      `Curated Collection - ${current.title}`,
                      'private',
                      `Interested in commissioning the complete ${current.title} suite (Estimate: ${formatNPR(totalNPR)}).`
                    )
                  }
                >
                  Enquire on this collection <Icon />
                </button>
              </div>
            </div>
          </div>
        </m.div>
      </AnimatePresence>
    </section>
  );
}

export default CuratedCollections;
