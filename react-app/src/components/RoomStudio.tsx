import { asset } from '../data/service';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';

const audiences = [
  { title: 'Homes', image: 'bedroom.webp', text: 'Mattress options and room inspiration for everyday comfort.' },
  { title: 'Furniture makers', image: 'cfi/pu-foam.webp', text: 'Foam products for cushioning and furniture applications.' },
  { title: 'Hotels & hospitality', image: 'cfi/euro-top.webp', text: 'Explore the mattress range and discuss your requirements.' },
  { title: 'Packaging', image: 'cfi/epe-foam.webp', text: 'EPE rolls, sheets and cushions for protective applications.' },
];
export function RoomStudio() {
  const { openEnquiry } = useApp();
  return <div className="room-studio-showcase" id="roomStudio">
    <div className="studio-top-intro"><div><span className="eyebrow">FROM HOME TO INDUSTRY</span><h3>Comfort and protection, for different needs.</h3><p>Explore products for homes, furniture makers, hospitality and packaging.</p></div></div>
    <div className="room-studio-grid">{audiences.map((item, index) => <article className="studio-slot-card" key={item.title}><div className="slot-visual"><img src={asset(item.image)} alt={item.title === 'Homes' ? 'Illustrative bedroom concept' : item.title} loading="lazy" /><span className="slot-badge">0{index + 1}</span></div><div className="slot-details"><div className="slot-title-row"><h4>{item.title}</h4></div><p className="slot-palette">{item.text}</p><button type="button" className="text-link" onClick={() => openEnquiry(item.title)}>Discuss your requirements <Icon /></button></div></article>)}</div>
  </div>;
}
export default RoomStudio;
