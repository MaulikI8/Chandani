import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';

export interface MaterialOption {
  id: string;
  name: string;
  category: 'wood' | 'fabric' | 'carpet' | 'stone';
  origin: string;
  spec: string;
  finish: string;
  durability: string;
  hex: string;
  tactileNote?: string;
}

export const woods: MaterialOption[] = [
  {
    id: 'sisau',
    name: 'Solid Sisau (Indian Rosewood)',
    category: 'wood',
    origin: 'Terai Foothills & Kathmandu Valley',
    spec: 'Dense interlocking auburn grain',
    finish: 'Hand-rubbed natural linseed oil',
    durability: 'Exceptional native hardwood; highly resistant to humidity fluctuation',
    hex: '#5c341f',
    tactileNote: 'Cool to touch, develops rich dark patina over decades',
  },
  {
    id: 'walnut',
    name: 'American Black Walnut',
    category: 'wood',
    origin: 'Sustainably Managed Appalachian Forests',
    spec: 'Subdued espresso tone with smooth linear grain',
    finish: 'Matte breathable organic hardwax oil',
    durability: 'Stable, velvety tactile finish with long-term dimensional integrity',
    hex: '#433428',
    tactileNote: 'Silky matte feel, low light glare',
  },
  {
    id: 'oak',
    name: 'European White Oak',
    category: 'wood',
    origin: 'Sustainably Certified Alpine Woodlands',
    spec: 'Biscuit-warm field with distinct ray flecks',
    finish: 'Ultra-matte raw wax preservation',
    durability: 'High surface hardness; withstands active dining and family living',
    hex: '#967f64',
    tactileNote: 'Open-pore architectural grain texture',
  },
  {
    id: 'ash',
    name: 'Natural Olive Ash',
    category: 'wood',
    origin: 'Northern Certified Groves',
    spec: 'Silvery pale timber with wave figuring',
    finish: 'Soap-rubbed breathable matte sealer',
    durability: 'High elasticity and tensile strength; maximizes ambient room light',
    hex: '#b3997b',
    tactileNote: 'Luminous, Scandinavian lightness',
  },
];

export const fabrics: MaterialOption[] = [
  {
    id: 'linen-ivory',
    name: 'Belgian Slubbed Linen (Ivory)',
    category: 'fabric',
    origin: 'Flanders, Belgium (100% natural flax)',
    spec: '480 g/m² heavyweight organic weave',
    finish: 'Enzyme-washed natural texture',
    durability: '35,000 Martindale rubs; breathes in summer, softens with age',
    hex: '#e6dfd3',
    tactileNote: 'Textured slub weave with natural breathability',
  },
  {
    id: 'boucle-oatmeal',
    name: 'Himalayan Wool Bouclé (Oatmeal)',
    category: 'fabric',
    origin: 'High-Altitude Wool & Cotton Core',
    spec: '620 g/m² dense loop pile',
    finish: 'Unbleached textured tactile loop',
    durability: '45,000 Martindale rubs; acoustic warmth and natural soil resistance',
    hex: '#d2c5b4',
    tactileNote: 'Cloud-like loop depth with acoustic absorption',
  },
  {
    id: 'velvet-moss',
    name: 'Cotton Velvet (Deep Moss)',
    category: 'fabric',
    origin: 'Loomed in northern Italy',
    spec: '540 g/m² combed cotton pile',
    finish: 'Directional low-sheen matte velvet',
    durability: '50,000 Martindale rubs; deep colour depth in evening light',
    hex: '#3f4738',
    tactileNote: 'Deep plush pile with rich shadow gradations',
  },
  {
    id: 'wool-slate',
    name: 'Heather Wool (Warm Slate)',
    category: 'fabric',
    origin: 'Pure Virgin Wool Twill',
    spec: '510 g/m² tight twill weave',
    finish: 'Naturally water-repellent lanolin finish',
    durability: '40,000 Martindale rubs; naturally fire-resistant without chemicals',
    hex: '#5c5f63',
    tactileNote: 'Subtle tailored twill with natural resilience',
  },
];

export const carpets: MaterialOption[] = [
  {
    id: 'tibetan-chalk',
    name: 'Highland Wool (Chalk Taupe)',
    category: 'carpet',
    origin: 'Patan Weaving Studio, Nepal',
    spec: '80-knot hand-spun Tibetan sheep wool',
    finish: '14 mm plush cut pile with stepped micro-border',
    durability: 'Lanolin-rich wool; naturally resilient against furniture crushing',
    hex: '#ded6cb',
    tactileNote: 'Plush underfoot with sound-dampening acoustic density',
  },
  {
    id: 'mineral-clay',
    name: 'Terracotta Mineral (Clay Earth)',
    category: 'carpet',
    origin: 'Kathmandu Valley Dye House',
    spec: 'Hand-knotted cut & loop combination',
    finish: '12 mm stepped relief with dark earth frame',
    durability: 'Organic madder root wash; holds rich tonal depth for generations',
    hex: '#b36b51',
    tactileNote: 'Textured cut-and-loop relief with grounding warmth',
  },
  {
    id: 'charcoal-ink',
    name: 'Midnight Weave (Deep Ink)',
    category: 'carpet',
    origin: 'Tibetan Plateau Semi-Worsted Wool',
    spec: 'Double-weft dense structural backing',
    finish: '14 mm cut pile with subtle shadow lines',
    durability: 'High foot-traffic resilience; grounds furniture in light floors',
    hex: '#2d2e33',
    tactileNote: 'Heavy grounding weight that absorbs ambient light',
  },
];

export const stones: MaterialOption[] = [
  {
    id: 'marble-banswara',
    name: 'Banswara White Marble',
    category: 'stone',
    origin: 'Rajasthan Quarzitic Formations',
    spec: 'Soft grey feather veining on pure calcium field',
    finish: 'Satin-honed matte touch (non-gloss)',
    durability: 'Natural cool stone; sealed against culinary oils and moisture',
    hex: '#ebe8e1',
    tactileNote: 'Cool silk-honed surface with delicate mineral clouding',
  },
  {
    id: 'slate-honed',
    name: 'Himalayan Honed Slate',
    category: 'stone',
    origin: 'Mustang Mountain Formations',
    spec: 'Dark charcoal fine-cleft mineral face',
    finish: 'Natural beeswax oil sealant',
    durability: 'Extreme heat resistance; ideal for hearths and dining trivets',
    hex: '#3a3d40',
    tactileNote: 'Organic fine-cleft mineral texture',
  },
  {
    id: 'brass-patinated',
    name: 'Patinated Valley Brass',
    category: 'stone',
    origin: 'Patan Bronze Artisans, Kathmandu',
    spec: 'Solid architectural brass alloy',
    finish: 'Hand-aged brush finish with micro-crystalline wax',
    durability: 'Develops a bespoke living patina with touch and age',
    hex: '#b89552',
    tactileNote: 'Warm metallic weight that records family touch over time',
  },
];

export function MaterialsExplorer() {
  const { openEnquiry } = useApp();
  const [selectedWood, setSelectedWood] = useState<MaterialOption>(woods[0]);
  const [selectedFabric, setSelectedFabric] = useState<MaterialOption>(fabrics[0]);
  const [selectedCarpet, setSelectedCarpet] = useState<MaterialOption>(carpets[0]);
  const [selectedStone, setSelectedStone] = useState<MaterialOption>(stones[0]);
  const [lighting, setLighting] = useState<'day' | 'evening'>('day');

  const handleEnquirePalette = () => {
    const summary = `Selected Materials: ${selectedWood.name}, ${selectedFabric.name}, ${selectedCarpet.name}, and ${selectedStone.name}.`;
    openEnquiry('Material Consultation', 'swatch', summary);
  };

  const handleOrderSwatchBox = () => {
    const summary = `Requesting complimentary physical material swatch box:\n- Wood: ${selectedWood.name}\n- Upholstery: ${selectedFabric.name}\n- Carpet: ${selectedCarpet.name}\n- Surface/Metal: ${selectedStone.name}`;
    openEnquiry('Complimentary Material Swatch Kit', 'swatch', summary);
  };

  return (
    <div className="materials-explorer" id="materialsExplorer">
      <div className="explorer-header">
        <div>
          <span className="eyebrow">AUTHENTIC FINISHES &amp; TEXTURES</span>
          <h3>The Materials Explorer</h3>
          <p>
            Compare real timbers, hand-spun upholstery weaves, high-altitude carpets, and natural stone finishes.
            Test how different materials interact under natural daylight and warm evening lamps.
          </p>
        </div>
        <div className="lighting-toggle" role="group" aria-label="Preview ambient lighting">
          <span className="lighting-label">Ambient Light:</span>
          <button
            type="button"
            className={`lighting-btn${lighting === 'day' ? ' active' : ''}`}
            aria-pressed={lighting === 'day'}
            onClick={() => setLighting('day')}
          >
            Daylight (5500K)
          </button>
          <button
            type="button"
            className={`lighting-btn${lighting === 'evening' ? ' active' : ''}`}
            aria-pressed={lighting === 'evening'}
            onClick={() => setLighting('evening')}
          >
            Evening (2700K)
          </button>
        </div>
      </div>

      <div className={`explorer-grid lighting-${lighting}`}>
        {/* Interactive Material Selectors */}
        <div className="materials-selectors">
          {/* Group 1: Wood */}
          <div className="material-group">
            <div className="group-header-row">
              <span className="group-label">01 / Solid Hardwood Joinery</span>
              {selectedWood.tactileNote && <span className="tactile-pill">{selectedWood.tactileNote}</span>}
            </div>
            <div className="swatch-chips" role="group" aria-label="Select wood finish">
              {woods.map((wood) => (
                <button
                  key={wood.id}
                  type="button"
                  className={`swatch-chip${selectedWood.id === wood.id ? ' active' : ''}`}
                  aria-pressed={selectedWood.id === wood.id}
                  onClick={() => setSelectedWood(wood)}
                >
                  <span className="swatch-color" style={{ backgroundColor: wood.hex }} />
                  <span className="swatch-name">{wood.name.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
            <p className="chip-description">
              <strong>{selectedWood.name}:</strong> {selectedWood.spec} from {selectedWood.origin}. {selectedWood.finish}.
            </p>
          </div>

          {/* Group 2: Fabric */}
          <div className="material-group">
            <div className="group-header-row">
              <span className="group-label">02 / Upholstery Weave</span>
              {selectedFabric.tactileNote && <span className="tactile-pill">{selectedFabric.tactileNote}</span>}
            </div>
            <div className="swatch-chips" role="group" aria-label="Select upholstery fabric">
              {fabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  type="button"
                  className={`swatch-chip${selectedFabric.id === fabric.id ? ' active' : ''}`}
                  aria-pressed={selectedFabric.id === fabric.id}
                  onClick={() => setSelectedFabric(fabric)}
                >
                  <span className="swatch-color" style={{ backgroundColor: fabric.hex }} />
                  <span className="swatch-name">{fabric.name.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
            <p className="chip-description">
              <strong>{selectedFabric.name}:</strong> {selectedFabric.spec}. {selectedFabric.durability}.
            </p>
          </div>

          {/* Group 3: Carpet */}
          <div className="material-group">
            <div className="group-header-row">
              <span className="group-label">03 / Hand-Knotted Carpet Foundation</span>
              {selectedCarpet.tactileNote && <span className="tactile-pill">{selectedCarpet.tactileNote}</span>}
            </div>
            <div className="swatch-chips" role="group" aria-label="Select carpet foundation">
              {carpets.map((carpet) => (
                <button
                  key={carpet.id}
                  type="button"
                  className={`swatch-chip${selectedCarpet.id === carpet.id ? ' active' : ''}`}
                  aria-pressed={selectedCarpet.id === carpet.id}
                  onClick={() => setSelectedCarpet(carpet)}
                >
                  <span className="swatch-color" style={{ backgroundColor: carpet.hex }} />
                  <span className="swatch-name">{carpet.name.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
            <p className="chip-description">
              <strong>{selectedCarpet.name}:</strong> {selectedCarpet.spec}. {selectedCarpet.finish}.
            </p>
          </div>

          {/* Group 4: Stone */}
          <div className="material-group">
            <div className="group-header-row">
              <span className="group-label">04 / Stone &amp; Architectural Hardware</span>
              {selectedStone.tactileNote && <span className="tactile-pill">{selectedStone.tactileNote}</span>}
            </div>
            <div className="swatch-chips" role="group" aria-label="Select stone or hardware">
              {stones.map((stone) => (
                <button
                  key={stone.id}
                  type="button"
                  className={`swatch-chip${selectedStone.id === stone.id ? ' active' : ''}`}
                  aria-pressed={selectedStone.id === stone.id}
                  onClick={() => setSelectedStone(stone)}
                >
                  <span className="swatch-color" style={{ backgroundColor: stone.hex }} />
                  <span className="swatch-name">{stone.name}</span>
                </button>
              ))}
            </div>
            <p className="chip-description">
              <strong>{selectedStone.name}:</strong> {selectedStone.spec}. {selectedStone.finish}.
            </p>
          </div>
        </div>

        {/* Live Material Tray Presentation */}
        <div className="materials-tray-card" aria-label="Combined Material Palette Presentation">
          <div className="tray-topline">
            <span className="eyebrow">PALETTE COMBINATION</span>
            <span className="tray-lighting-tag">
              {lighting === 'day' ? 'Natural Morning Sun' : 'Warm Evening Lamp'}
            </span>
          </div>

          <div className="tray-composition-visual">
            <div className="tray-tile tile-wood" style={{ backgroundColor: selectedWood.hex }}>
              <div className="tile-glass-badge">
                <span className="tile-category">WOOD</span>
                <strong>{selectedWood.name.split('(')[0].trim()}</strong>
              </div>
            </div>
            <div className="tray-tile tile-fabric" style={{ backgroundColor: selectedFabric.hex }}>
              <div className="tile-glass-badge">
                <span className="tile-category">UPHOLSTERY</span>
                <strong>{selectedFabric.name.split('(')[0].trim()}</strong>
              </div>
            </div>
            <div className="tray-tile tile-carpet" style={{ backgroundColor: selectedCarpet.hex }}>
              <div className="tile-glass-badge">
                <span className="tile-category">CARPET</span>
                <strong>{selectedCarpet.name.split('(')[0].trim()}</strong>
              </div>
            </div>
            <div className="tray-tile tile-stone" style={{ backgroundColor: selectedStone.hex }}>
              <div className="tile-glass-badge">
                <span className="tile-category">SURFACE</span>
                <strong>{selectedStone.name}</strong>
              </div>
            </div>
          </div>

          <div className="tray-spec-summary">
            <h4>Bespoke Material Synergy</h4>
            <p>
              Combining <strong>{selectedWood.name.split('(')[0].trim()}</strong> with{' '}
              <strong>{selectedFabric.name.split('(')[0].trim()}</strong> creates a tactile balance between architectural timber weight and soft light reflection.
              Grounded by <strong>{selectedCarpet.name.split('(')[0].trim()}</strong>, this palette provides acoustic calm and enduring elegance.
            </p>
            <div className="tray-actions">
              <button type="button" className="button" onClick={handleEnquirePalette}>
                Enquire with this palette <Icon />
              </button>
              <button type="button" className="button outline" onClick={handleOrderSwatchBox}>
                Order physical swatch box ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaterialsExplorer;
