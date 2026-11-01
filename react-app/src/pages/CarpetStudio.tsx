import { useEffect, useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import type { CarpetColour, Light } from '../data/types';
import { asset } from '../data/service';
import { SiteLink } from '../components/Navigation';
import { ProductCard, SaveButton } from '../components/Products';
import { Comparison, type ComparisonProps } from '../components/Comparison';
import { colours } from '../components/TryRoomDialog';
import { Icon } from '../components/Icon';
import { RevealSection, MotionButton } from '../components/Interactions';
import { useDialog } from '../hooks/useDialog';

function ExpandedComparison({ onClose, ...props }: ComparisonProps & { onClose: () => void }) {
  const dialog = useDialog();
  return <dialog ref={dialog} data-lenis-prevent className="studio-expanded" aria-label="Expanded carpet comparison" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="studio-expanded-bar">
      <span className="eyebrow">CARPET STUDIO · EXPANDED VIEW</span>
      <button type="button" className="button outline studio-expanded-close" onClick={onClose} aria-label="Close expanded view">
        Close view (Esc) ✕
      </button>
    </div>
    <Comparison {...props} />
  </dialog>;
}
export function CarpetStudio() {
  const { products, query, openEnquiry, chooseVariant } = useApp();
  const location = useLocation();
  const requested = new URLSearchParams(location.search).get('rug');
  const colour: CarpetColour = requested && Object.hasOwn(colours, requested) ? requested as CarpetColour : 'clay';
  const [split, setSplit] = useState(65);
  const [light, setLight] = useState<Light>('day');
  const [expanded, setExpanded] = useState(false);
  const product = products[colour];
  useEffect(() => {
    ['room-clay.webp', 'room-chalk.webp', 'room-ink.webp', 'room-empty.webp'].forEach(src => {
      const img = new Image();
      img.src = asset(src);
    });
  }, []);
  useEffect(() => { if (requested && Object.hasOwn(colours, requested)) chooseVariant('living', 'carpet', requested); }, [requested]); // URL is the studio selection source.
  function select(id: CarpetColour) { chooseVariant('living', 'carpet', id); query({ rug: id }); }
  const comparison: ComparisonProps = { studio: true, before: 'room-empty.webp', after: `room-${colour}.webp`, beforeAlt: 'Living room with a bare oak floor', afterAlt: `Living room with ${product.name}`, ratio: 1.5, withLabel: 'With carpet', withoutLabel: 'Bare floor', split, onSplit: setSplit, light, expanded: false, onExpand: () => setExpanded(true), sceneLabel: product.name.toUpperCase() };
  return <><section className="rug-studio section"><div className="studio-heading"><div><SiteLink className="back-link" to="/?room=living#home-room">← Back to the home</SiteLink><span className="eyebrow">THE CARPET STUDIO</span><h1>One room.<br /><em>A different feeling.</em></h1></div><p>Choose a colour, then move the divider.<br />See what a carpet brings to the room.</p></div>
    <Comparison {...comparison} />
    <div className="rug-controls"><div className="rug-colours" aria-label="Carpet colour">{(Object.keys(colours) as CarpetColour[]).map(id => <button key={id} aria-pressed={colour === id} onClick={() => select(id)}><i style={{ '--swatch': colours[id].hex } as CSSProperties} />{colours[id].label}</button>)}</div>
      <div className="rug-light"><button aria-pressed={light === 'day'} onClick={() => setLight('day')}>Day</button><button aria-pressed={light === 'evening'} onClick={() => setLight('evening')}>Evening</button><button onClick={() => { select('clay'); setSplit(65); setLight('day'); }}>Reset</button></div>
      <MotionButton className="button" onClick={() => openEnquiry(product.name)}>Enquire about {colours[colour].label} <Icon /></MotionButton>
    </div><div className="studio-foot"><span>Illustrative room. Lighting is a visual filter.</span><SaveButton className="text-link" id={colour}>Save this carpet</SaveButton></div>
  </section><RevealSection className="studio-collection section"><div className="section-heading"><div><span className="eyebrow">THE FRAME STUDY</span><h2>Find your colour.</h2></div><SiteLink className="text-link" to="/#collection">Explore the whole collection <Icon /></SiteLink></div><div className="product-grid">{(['clay', 'chalk', 'ink'] as const).map(id => <ProductCard key={id} product={products[id]} />)}</div></RevealSection>
    {expanded && <ExpandedComparison {...comparison} expanded onExpand={() => setExpanded(false)} onClose={() => setExpanded(false)} />}
  </>;
}
