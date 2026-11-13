import { asset } from '../data/service';
import { business } from '../data/business';
import { SiteLink } from './Navigation';
import { Icon } from './Icon';

const pillars = [
  { image: 'cfi/pu-foam.webp', label: '01 / FOAM', title: 'Made in eastern Nepal', text: 'The company produces PU and EPE foam at its facility in Sunsari.' },
  { image: 'cfi/euro-top.webp', label: '02 / MATTRESSES', title: 'A range for rest', text: 'Explore the Comfort, Flexible Spring and Premium / Luxury mattress series.' },
  { image: 'cfi/epe-foam.webp', label: '03 / PROTECTION', title: 'Foam for packaging', text: 'EPE rolls, sheets and cushions support a range of protective applications.' },
];
export function AtelierCraftStory() {
  return <section className="atelier-craft-story showroom-extension section" id="atelier">
    <div className="section-heading"><div><span className="eyebrow">OUR FACTORY</span><h2>Made with purpose.</h2></div><p>{business.name} manufactures mattresses and foam products in eastern Nepal.</p></div>
    <div className="craft-pillars-grid">{pillars.map(item => <article className="pillar-card" key={item.label}><div className="pillar-image-wrap"><img src={asset(item.image)} alt={item.title} loading="lazy" /><span className="pillar-badge">{item.label}</span></div><div className="pillar-content"><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
    <p><SiteLink className="text-link" to="/atelier">About the company <Icon /></SiteLink></p>
  </section>;
}
export default AtelierCraftStory;
