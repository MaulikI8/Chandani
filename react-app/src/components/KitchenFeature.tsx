import { RevealSection, MotionButton } from './Interactions';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { Icon } from './Icon';
export function KitchenFeature() {
  const { openEnquiry, query } = useApp();
  return <RevealSection className="kitchen-section" id="kitchens"><div className="kitchen-image"><img src={asset('kitchen.webp')} width="1881" height="836" loading="lazy" alt="Kitchen design concept with a walnut island, stone-style worktop and green cabinetry" /><span className="image-caption">A KITCHEN DESIGN STUDY</span></div><div className="kitchen-copy"><span className="eyebrow">KITCHEN DESIGN / CHANDANI</span><h2>Made around<br />the way<br /><em>you live.</em></h2><p>A place to cook. To catch up. To come together. Start with your space, then explore the layout, storage and finishes that feel right.</p><MotionButton className="button light" onClick={() => openEnquiry('Kitchen design')}>Let’s plan your kitchen <Icon /></MotionButton><button className="text-link" onClick={() => query({ room: 'kitchen', piece: null }, '#home-room')}>Explore the kitchen concept <Icon name="right" /></button></div></RevealSection>;
}
