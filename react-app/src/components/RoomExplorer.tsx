import { useEffect, useRef, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import type { RoomId } from '../data/types';
import { Icon } from './Icon';
import { SiteLink } from './Navigation';
import { SaveButton } from './Products';
import { CrossfadeImage } from './CrossfadeImage';
import { useImagePair } from '../hooks/useImagePair';
import { MotionButton } from './Interactions';
import RoomToolbar from './RoomToolbar';

const roomLabels: Record<RoomId, string> = { living: 'Living room', kitchen: 'Kitchen', bedroom: 'Bedroom', dining: 'Dining' };
export function RoomExplorer() {
  const { content, products, query, openProduct, openEnquiry, openTry, tryEntry, saveConfiguration } = useApp();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedRoom = params.get('room');
  const exploring = !!requestedRoom && Object.hasOwn(content.rooms, requestedRoom);
  const roomId: RoomId = exploring ? requestedRoom as RoomId : 'living';
  const room = content.rooms[roomId];
  const { status, revision, retry } = useImagePair(room.image, room.image);
  const index = Math.max(0, room.items.findIndex(item => (item.product ?? item.id) === params.get('piece')));
  const item = room.items[index];
  const product = item.product ? products[item.product] : undefined;
  const exploreButton = useRef<HTMLButtonElement>(null);
  const firstHotspot = useRef<HTMLButtonElement>(null);
  const focusAfterLoad = useRef(false);
  const returnToExplore = useRef(false);
  useEffect(() => {
    if (exploring && status === 'ready' && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      if (document.activeElement === exploreButton.current || document.activeElement === document.body || document.activeElement?.closest('.scene-photo .try-loading')) firstHotspot.current?.focus({ preventScroll: true });
    }
  }, [status, exploring]);
  useEffect(() => {
    if (!exploring && returnToExplore.current) {
      returnToExplore.current = false;
      exploreButton.current?.focus({ preventScroll: true });
    }
  }, [exploring]);
  const explore = (id: RoomId) => query({ room: id, piece: null }, '#home-room');

  return <section className="home-room" id="home-room" aria-label="Explore a Chandani home">
    <div className={`scene${exploring ? ' exploring' : ''}`} id="scene">
      <div className="scene-photo" id="scenePhoto">
        <CrossfadeImage ready={status === 'ready'} revision={revision} id="sceneImage" src={asset(room.image)} width="1919" height="820" fetchPriority="high" alt={exploring ? room.alt : 'A light living room with an ivory sofa, a bordered rug and a sculptural side table'} />
        {exploring && status !== 'ready' && <div className="try-loading" role="status"><span>{status === 'error' ? 'The room photograph could not load.' : `Loading ${room.label.toLowerCase()}…`}</span>{status === 'error' && <button onClick={() => { focusAfterLoad.current = true; retry(); }}>Try again</button>}</div>}
        <div className="hotspots" id="hotspots" hidden={!exploring}>
          {room.items.map((hotspot, i) => <button key={hotspot.product ?? hotspot.id} ref={i === 0 ? firstHotspot : undefined} disabled={status !== 'ready'} className="hotspot" style={{ '--x': `${hotspot.x}%`, '--y': `${hotspot.y}%` } as CSSProperties} aria-label={`Explore ${hotspot.label.toLowerCase()}`} aria-pressed={i === index} onClick={() => query({ piece: hotspot.product ?? hotspot.id }, undefined, true)}>
            <span className="pin">{String(i + 1).padStart(2, '0')}</span><span className="pin-label">{hotspot.label}</span>
          </button>)}
        </div>
        <div className="scene-topline" id="sceneTopline" hidden={!exploring}><span>{room.number} / {room.label.toUpperCase()}</span><button aria-label="Return to introduction" onClick={() => { returnToExplore.current = true; query({ room: null, piece: null }); }}>Close room view ×</button></div>
      </div>
      <div className="hero-copy" id="heroCopy" hidden={exploring}><span className="eyebrow">FURNITURE, CARPETS &amp; INTERIORS</span><h1>A home,<br />in your<br /><em>own way.</em></h1><p>From the sofa you sink into to the kitchen you gather in. Find what makes a space yours.</p>
        <MotionButton className="button" ref={exploreButton} onClick={() => { focusAfterLoad.current = true; explore('living'); }}>Explore this room <Icon /></MotionButton>
        <a className="text-link" href="#categories">Discover the collection <span>↓</span></a>
      </div>
      <div className="scene-card" id="sceneCard" hidden={!exploring} aria-live="polite">
        <span className="eyebrow">{room.label.toUpperCase()} / {String(index + 1).padStart(2, '0')}</span>
        {product ? <><h3>{product.name}</h3><p>{product.text}</p><button className="button" onClick={() => openProduct(product.id)}>Explore the piece <Icon /></button><div className="scene-small-actions"><SaveButton id={product.id} className="" iconFirst />{product.category === 'carpets' ? <SiteLink to={`/carpet-studio?rug=${product.id}`}>Compare colours ↗</SiteLink> : <button onClick={() => openEnquiry(product.name)}>Enquire ↗</button>}</div></> : <><h3>{item.title}</h3><p>{item.text}</p><button className="button" onClick={() => openEnquiry(item.interest!)}>Discuss this idea <Icon /></button><div className="scene-small-actions"><a href="#kitchens">About kitchen design ↓</a></div></>}
      </div>
    </div>
    <div className={`room-toolbar${exploring ? ' has-view-actions' : ''}`}><div className="room-intro"><span className="eyebrow">A DIFFERENT WAY TO EXPLORE</span><span>Start with a room.</span></div>
      <div className="room-tabs" aria-label="Choose a room">{(Object.keys(content.rooms) as RoomId[]).map(id => <button key={id} onClick={() => explore(id)} aria-pressed={id === roomId}><span>{content.rooms[id].number}</span> {roomLabels[id]}</button>)}</div>
      <MotionButton className="room-hint try-room-launch" onClick={() => openTry(undefined, roomId)} aria-haspopup="dialog" aria-expanded={!!tryEntry}>Try the room <Icon /></MotionButton>
      {exploring && <RoomToolbar onReset={() => explore(roomId)} onSave={saveConfiguration} />}
    </div>
  </section>;
}
