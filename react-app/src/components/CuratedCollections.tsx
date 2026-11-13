import { useState } from 'react';
import { asset } from '../data/service';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';
import type { RoomId } from '../data/types';

const scenes: { id: RoomId; title: string; image: string; description: string; pieces: string[] }[] = [
  { id: 'living', title: 'A quieter living room', image: 'hero-chalk-wide.webp', description: 'Explore the balance of a sofa, a carpet and the details around them.', pieces: ['sofa', 'chalk', 'side-table'] },
  { id: 'bedroom', title: 'A place to rest', image: 'bedroom.webp', description: 'A bedroom concept built around warm tones and a comfortable place to unwind.', pieces: ['bed', 'lamp', 'wardrobe'] },
  { id: 'dining', title: 'Space to gather', image: 'dining.webp', description: 'A dining concept for everyday meals and longer conversations.', pieces: ['dining-table', 'dining-chair'] },
];

export function CuratedCollections() {
  const [active, setActive] = useState(0);
  const { products, openProduct, openTry } = useApp();
  const scene = scenes[active];
  return <section className="curated-collections showroom-extension section" id="curatedCollections">
    <div className="section-heading"><div><span className="eyebrow">ROOM INSPIRATION</span><h2>Thoughtful spaces, made personal.</h2></div><p>Take a closer look at these illustrative rooms and the ideas that bring them together.</p></div>
    <div className="collection-tabs-bar" role="group" aria-label="Choose an inspiration scene">{scenes.map((item, index) => <button type="button" key={item.id} aria-pressed={active === index} className={`collection-nav-tab${active === index ? ' active' : ''}`} onClick={() => setActive(index)}><span className="tab-number">0{index + 1}</span><span className="tab-title">{item.title}</span></button>)}</div>
    <div className="collection-editorial-card">
      <div className="editorial-visual-frame"><img src={asset(scene.image)} alt={`${scene.title}, an illustrative room concept`} loading="lazy" /><div className="visual-overlay-caption"><div className="palette-info-block"><span className="eyebrow">ROOM CONCEPT</span><strong>{scene.title}</strong></div></div></div>
      <div className="editorial-story-content"><div className="story-header"><span className="eyebrow">INSPIRATION / 0{active + 1}</span><h3>{scene.title}</h3></div><p className="story-body">{scene.description}</p><div className="story-shoppable-pieces"><span className="eyebrow">EXPLORE THE CONCEPT</span><div className="pieces-list">{scene.pieces.filter(id => products[id]).map((id, index) => <div className="piece-row" key={id}><div className="piece-meta"><span className="piece-index">0{index + 1}</span><div><strong>{products[id].name}</strong><span className="piece-cat">Illustrative concept</span></div></div><button type="button" className="text-link-small" onClick={() => openProduct(id)}>Explore ↗</button></div>)}</div></div><div className="editorial-actions-row"><button type="button" className="button" onClick={() => openTry(undefined, scene.id)}>Try the room <Icon /></button></div><p className="fineprint">Room scenes and furniture shown are illustrative concepts.</p></div>
    </div>
  </section>;
}
export default CuratedCollections;
