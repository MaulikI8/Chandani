import { RevealSection } from './Interactions';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { Icon } from './Icon';

const categories = [
  { id: 'seating', title: 'Sofas & seating', sub: 'Make yourself comfortable', image: 'sofa.webp', className: 'sofa' },
  { id: 'carpets', title: 'Carpets', sub: 'Give the room its foundation', image: 'product-clay.webp', className: 'rug' },
  { id: 'bedroom', title: 'Bedroom', sub: 'Make space to slow down', image: 'bedroom.webp', className: 'bedroom' },
  { id: 'dining', title: 'Dining', sub: 'For everyday gatherings', image: 'dining.webp', className: 'dining' },
];
export function CategoryDirectory() {
  const { query } = useApp();
  return <RevealSection className="categories section" id="categories"><div className="section-heading"><div><span className="eyebrow">THE CHANDANI HOME</span><h2>One piece.<br />Or a whole new perspective.</h2></div><p>Some things bring a room together.<br />Others become the reason for the room.<br />Find your starting point.</p></div>
    <div className="category-grid">{categories.map(c => <button className="category" key={c.id} onClick={() => query({ category: c.id }, '#collection')}><div className={`category-image ${c.className}`}><img src={asset(c.image)} loading="lazy" alt={`${c.title} design concept`} /></div><span className="category-title">{c.title}<Icon /></span><span className="category-sub">{c.sub}</span></button>)}</div>
    <div className="category-more"><span>And the details that finish it.</span><button onClick={() => query({ category: 'lighting' }, '#collection')}>Lighting &amp; décor <Icon /></button><button onClick={() => query({ category: 'storage' }, '#collection')}>Storage <Icon /></button><a href="#kitchens">Kitchen design <Icon /></a></div>
  </RevealSection>;
}
