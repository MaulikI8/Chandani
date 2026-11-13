import { useState } from 'react';
import { asset } from '../data/service';
import { useApp } from '../state/AppContext';
import type { RoomId } from '../data/types';
import { Icon } from './Icon';

const rooms: RoomId[] = ['living', 'dining', 'bedroom', 'kitchen'];

export function ShopByRoom() {
  const [selected, setSelected] = useState<RoomId>('living');
  const { content, openTry, query } = useApp();
  const room = content.rooms[selected];
  return <section className="shop-by-room showroom-extension section" id="shopByRoom">
    <div className="section-heading"><div><span className="eyebrow">EXPLORE A SPACE</span><h2>Find your room.</h2></div><p>Choose a room to explore the ideas and compare prepared views.</p></div>
    <div className="room-nav-pills" role="group" aria-label="Select a room">{rooms.map((id, index) => <button type="button" className={`room-pill${selected === id ? ' active' : ''}`} key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}><span className="room-pill-num">0{index + 1}</span><span className="room-pill-label">{content.rooms[id].label}</span></button>)}</div>
    <div className="room-editorial-display"><div className="room-display-photo"><img src={asset(room.image)} alt={`${room.label}, an illustrative room concept`} loading="lazy" /><div className="photo-env-tag"><span>{room.label.toUpperCase()}</span></div></div><div className="room-display-info"><div className="info-header"><span className="eyebrow">ROOM INSPIRATION</span><h3>{room.label}</h3><p className="description">Use this illustrative scene as a starting point. Explore a prepared before-and-after view or open the room to see its details.</p></div><div className="room-cta-row"><button type="button" className="button" onClick={() => openTry(undefined, selected)}>Try the room <Icon /></button><button type="button" className="button outline" onClick={() => query({ room: selected, piece: null }, '#home-room')}>Explore this room</button></div></div></div>
  </section>;
}
export default ShopByRoom;
