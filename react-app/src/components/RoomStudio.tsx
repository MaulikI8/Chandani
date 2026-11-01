import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useApp } from '../state/AppContext';
import { asset, formatNPR } from '../data/service';
import { Icon } from './Icon';
import { toast } from 'sonner';

interface StudioPiece {
  id: string;
  name: string;
  type: string;
  palette: string;
  priceNPR: number;
  image: string;
}

const studioInventory: Record<string, StudioPiece[]> = {
  sofa: [
    { id: 'sofa', name: 'Haven / Sofa', type: 'Living', palette: 'Ivory / bouclé', priceNPR: 320000, image: 'sofa.webp' },
    { id: 'chair', name: 'Monolith / Lounge Chair', type: 'Living', palette: 'Oatmeal / solid ash', priceNPR: 145000, image: 'without-side-table.webp' },
  ],
  carpet: [
    { id: 'clay', name: 'Frame / Clay', type: 'Carpets', palette: 'Terracotta / dark earth', priceNPR: 180000, image: 'product-clay.webp' },
    { id: 'chalk', name: 'Frame / Chalk', type: 'Carpets', palette: 'Oatmeal / soft taupe', priceNPR: 175000, image: 'product-chalk.webp' },
    { id: 'ink', name: 'Frame / Ink', type: 'Carpets', palette: 'Midnight charcoal / deep navy', priceNPR: 185000, image: 'product-ink.webp' },
  ],
  table: [
    { id: 'side-table', name: 'Kanso / Coffee Table', type: 'Living', palette: 'American Walnut', priceNPR: 95000, image: 'without-lamp.webp' },
    { id: 'dining-table', name: 'Arc / Dining Table', type: 'Dining', palette: 'Solid White Oak', priceNPR: 240000, image: 'without-dining-chairs.webp' },
  ],
  accent: [
    { id: 'lamp', name: 'Halo / Table Light', type: 'Lighting', palette: 'Patinated Brass & Alabaster', priceNPR: 38000, image: 'without-wardrobe.webp' },
    { id: 'wardrobe', name: 'Form / Wardrobe', type: 'Storage', palette: 'Natural Walnut & Cane', priceNPR: 285000, image: 'bedroom.webp' },
  ],
};

export function RoomStudio() {
  const { toggleSave, saved, openEnquiry, openTry } = useApp();
  const [selectedSofa, setSelectedSofa] = useState<StudioPiece>(studioInventory.sofa[0]);
  const [selectedCarpet, setSelectedCarpet] = useState<StudioPiece>(studioInventory.carpet[0]);
  const [selectedTable, setSelectedTable] = useState<StudioPiece>(studioInventory.table[0]);
  const [selectedAccent, setSelectedAccent] = useState<StudioPiece>(studioInventory.accent[0]);

  const totalPackageNPR = selectedSofa.priceNPR + selectedCarpet.priceNPR + selectedTable.priceNPR + selectedAccent.priceNPR;

  const handleSaveWholeSet = () => {
    const ids = [selectedSofa.id, selectedCarpet.id, selectedTable.id, selectedAccent.id];
    let addedCount = 0;
    ids.forEach((id) => {
      if (!saved.includes(id)) {
        toggleSave(id);
        addedCount++;
      }
    });
    toast.success('Room Set Saved to Shortlist', {
      description: `${addedCount} coordinating pieces added to your personal shortlist.`,
    });
  };

  const handleEnquireSet = () => {
    const list = `${selectedSofa.name} (${formatNPR(selectedSofa.priceNPR)}), ${selectedCarpet.name} (${formatNPR(selectedCarpet.priceNPR)}), ${selectedTable.name} (${formatNPR(selectedTable.priceNPR)}), and ${selectedAccent.name} (${formatNPR(selectedAccent.priceNPR)}). Package Estimate: ${formatNPR(totalPackageNPR)}.`;
    openEnquiry('Coordinated Room Studio Package', 'private', `Interested in commissioning this bespoke room ensemble:\n${list}`);
  };

  return (
    <div className="room-studio-showcase" id="roomStudio">
      <div className="studio-top-intro">
        <div>
          <span className="eyebrow">BESPOKE INTERIOR ENSEMBLE</span>
          <h3>The Chandani Room Studio</h3>
          <p>
            Curate coordinating furniture, high-altitude carpets, and sculptural lighting into an intentional room package.
            Independently tailor each element to your home&apos;s architecture while viewing transparent estimates in Nepali Rupees.
          </p>
        </div>
        <div className="studio-package-badge">
          <span className="badge-label">COORDINATED ENSEMBLE TOTAL</span>
          <strong className="badge-price">{formatNPR(totalPackageNPR)}</strong>
          <small>Including Kathmandu Valley delivery &amp; positioning</small>
        </div>
      </div>

      <div className="room-studio-grid">
        {/* Slot 1: Seating */}
        <div className="studio-slot-card">
          <div className="slot-visual">
            <AnimatePresence mode="wait">
              <m.img
                key={selectedSofa.id}
                src={asset(selectedSofa.image)}
                alt={selectedSofa.name}
                loading="lazy"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.85, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <span className="slot-badge">01 / SEATING ANCHOR</span>
          </div>
          <div className="slot-details">
            <div className="slot-title-row">
              <h4>{selectedSofa.name}</h4>
              <span className="slot-price">{formatNPR(selectedSofa.priceNPR)}</span>
            </div>
            <p className="slot-palette">{selectedSofa.palette}</p>
            <div className="slot-variants-row" role="group" aria-label="Choose seating anchor">
              {studioInventory.sofa.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`variant-pill${selectedSofa.id === s.id ? ' active' : ''}`}
                  aria-pressed={selectedSofa.id === s.id}
                  onClick={() => setSelectedSofa(s)}
                >
                  {s.name.split('/')[1]?.trim() ?? s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slot 2: Carpet Foundation */}
        <div className="studio-slot-card">
          <div className="slot-visual">
            <AnimatePresence mode="wait">
              <m.img
                key={selectedCarpet.id}
                src={asset(selectedCarpet.image)}
                alt={selectedCarpet.name}
                loading="lazy"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.85, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <span className="slot-badge">02 / CARPET FOUNDATION</span>
          </div>
          <div className="slot-details">
            <div className="slot-title-row">
              <h4>{selectedCarpet.name}</h4>
              <span className="slot-price">{formatNPR(selectedCarpet.priceNPR)}</span>
            </div>
            <p className="slot-palette">{selectedCarpet.palette}</p>
            <div className="slot-variants-row" role="group" aria-label="Choose carpet colourway">
              {studioInventory.carpet.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`variant-pill${selectedCarpet.id === c.id ? ' active' : ''}`}
                  aria-pressed={selectedCarpet.id === c.id}
                  onClick={() => setSelectedCarpet(c)}
                >
                  {c.name.split('/')[1]?.trim() ?? c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slot 3: Hardwood Joinery */}
        <div className="studio-slot-card">
          <div className="slot-visual">
            <AnimatePresence mode="wait">
              <m.img
                key={selectedTable.id}
                src={asset(selectedTable.image)}
                alt={selectedTable.name}
                loading="lazy"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.85, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <span className="slot-badge">03 / HARDWOOD JOINERY</span>
          </div>
          <div className="slot-details">
            <div className="slot-title-row">
              <h4>{selectedTable.name}</h4>
              <span className="slot-price">{formatNPR(selectedTable.priceNPR)}</span>
            </div>
            <p className="slot-palette">{selectedTable.palette}</p>
            <div className="slot-variants-row" role="group" aria-label="Choose joinery piece">
              {studioInventory.table.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`variant-pill${selectedTable.id === t.id ? ' active' : ''}`}
                  aria-pressed={selectedTable.id === t.id}
                  onClick={() => setSelectedTable(t)}
                >
                  {t.name.split('/')[1]?.trim() ?? t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slot 4: Lighting & Accents */}
        <div className="studio-slot-card">
          <div className="slot-visual">
            <AnimatePresence mode="wait">
              <m.img
                key={selectedAccent.id}
                src={asset(selectedAccent.image)}
                alt={selectedAccent.name}
                loading="lazy"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.85, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <span className="slot-badge">04 / ACCENT &amp; LIGHTING</span>
          </div>
          <div className="slot-details">
            <div className="slot-title-row">
              <h4>{selectedAccent.name}</h4>
              <span className="slot-price">{formatNPR(selectedAccent.priceNPR)}</span>
            </div>
            <p className="slot-palette">{selectedAccent.palette}</p>
            <div className="slot-variants-row" role="group" aria-label="Choose accent piece">
              {studioInventory.accent.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`variant-pill${selectedAccent.id === a.id ? ' active' : ''}`}
                  aria-pressed={selectedAccent.id === a.id}
                  onClick={() => setSelectedAccent(a)}
                >
                  {a.name.split('/')[1]?.trim() ?? a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Package Actions Bar */}
      <div className="studio-actions-footer">
        <div className="footer-harmony-note">
          <span className="eyebrow">CURATORIAL SYNERGY</span>
          <p>
            <strong>{selectedSofa.palette.split('/')[0].trim()}</strong> upholstery is grounded by the{' '}
            <strong>{selectedCarpet.palette.split('/')[0].trim()}</strong> weave, with natural wood warmth from the{' '}
            <strong>{selectedTable.palette}</strong> joinery.
          </p>
        </div>
        <div className="footer-cta-buttons">
          <button type="button" className="button outline" onClick={handleSaveWholeSet}>
            Save all 4 pieces to shortlist <Icon name="save" />
          </button>
          <button type="button" className="button outline" onClick={() => openTry('sofa', 'living')}>
            Test in Try the Room <Icon />
          </button>
          <button type="button" className="button" onClick={handleEnquireSet}>
            Enquire on ensemble ({formatNPR(totalPackageNPR)}) <Icon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomStudio;
