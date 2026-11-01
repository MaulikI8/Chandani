import { useState, type CSSProperties } from 'react';
import { useApp, type TryEntry } from '../state/AppContext';
import { useDialog, outsideDialog } from '../hooks/useDialog';
import type { CarpetColour, Light, RoomId } from '../data/types';
import { Comparison } from './Comparison';
import { SaveButton } from './Products';
import { Icon } from './Icon';
import { RoomConfiguration } from './RoomConfiguration';
import { MotionButton } from './Interactions';
import FurnitureTray from './FurnitureTray';
import { asset } from '../data/service';

import { toast } from 'sonner';

export const colours: Record<CarpetColour, { label: string; hex: string }> = { clay: { label: 'Clay', hex: '#9e4e2c' }, chalk: { label: 'Chalk', hex: '#d4c4a8' }, ink: { label: 'Ink', hex: '#3c3733' } };
export function TryRoomDialog({ initial }: { initial: TryEntry }) {
  const { content, products, configuration, chooseVariant, setTryEntry, openEnquiry, toastMessage } = useApp();
  const dialog = useDialog();
  const [roomId, setRoom] = useState(initial.room);
  const [itemId, setItem] = useState(initial.item);
  const room = content.comparisons[roomId];
  const item = room.items.find(entry => entry.id === itemId) ?? room.items[0];
  const [split, setSplit] = useState(item.split ?? 50);
  const [light, setLight] = useState<Light>('day');
  const [expanded, setExpanded] = useState(false);
  const selectedCarpet = configuration.rooms.living.carpet;
  const colour: CarpetColour = selectedCarpet && selectedCarpet in colours ? selectedCarpet as CarpetColour : 'chalk';
  const product = products[item.colours ? colour : item.product ?? ''];
  const close = () => setTryEntry(null);
  function selectItem(id: string, roomKey = roomId) {
    const entry = content.comparisons[roomKey].items.find(i => i.id === id)!;
    setRoom(roomKey); setItem(id); setSplit(entry.split ?? 50); setLight('day');
  }

  function handleShareRoom() {
    const params = new URLSearchParams();
    params.set('room', roomId);
    params.set('piece', item.id);
    if (item.colours) params.set('rug', colour);
    if (light === 'evening') params.set('light', 'evening');
    const shareUrl = `${window.location.origin}/?${params.toString()}#home-room`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Room link copied to clipboard', {
          description: `${room.label} with ${item.label} (${light} light).`
        });
      }).catch(() => {
        toast.info(`Room link: ${shareUrl}`);
      });
    } else {
      toast.info(`Room link: ${shareUrl}`);
    }
  }

  return <dialog ref={dialog} data-lenis-prevent className={`try-room-dialog${expanded ? ' try-room-expanded' : ''}`} id="tryRoom" aria-labelledby="tryRoomTitle" aria-modal="true" onCancel={event => { event.preventDefault(); if (expanded) setExpanded(false); else close(); }} onClick={event => { if (outsideDialog(event)) close(); }}>
    <header className="try-room-head"><div><span className="eyebrow">TRY THE ROOM</span><h2 id="tryRoomTitle">See what a piece changes.</h2></div><button className="icon-button" onClick={close} aria-label="Close Try the room" autoFocus>×</button></header>
    <div className="try-room-body"><p className="try-guidance">Choose a room and a piece, then compare the two views.</p><nav className="try-room-tabs" aria-label="Choose a room to try">{(Object.keys(content.comparisons) as RoomId[]).map(id => <button key={id} aria-pressed={id === roomId} onClick={() => selectItem(content.comparisons[id].items[0].id, id)}>{content.comparisons[id].label}</button>)}</nav>
      <div className="try-workspace"><aside className="try-sidebar"><span className="eyebrow">CHOOSE WHAT TO TRY</span>
        <div className="try-items" role="group" aria-label="Choose a piece">{room.items.map(entry => <button key={entry.id} aria-pressed={entry.id === item.id} onClick={() => selectItem(entry.id)}><span>{entry.label}</span><span aria-hidden="true">↗</span></button>)}</div>
        <div className="try-selection" aria-live="polite" aria-atomic="true">
          <h3>{product?.name ?? 'Kitchen design'}</h3>
          <p>{product?.text ?? 'Compare the room before the kitchen installation with the finished design concept.'}</p>
          {product && <div className="try-specs"><span><strong>Palette:</strong> {product.palette}</span><span><strong>Collection:</strong> {product.type}</span></div>}
        </div>
        {item.colours && <div className="try-colours" role="group" aria-label="Carpet colour">{(Object.keys(colours) as CarpetColour[]).map(id => <button key={id} aria-pressed={colour === id} onClick={() => chooseVariant('living', 'carpet', id)}><i aria-hidden="true" style={{ '--colour': colours[id].hex } as CSSProperties} />{colours[id].label}</button>)}</div>}
      </aside><div className="try-preview">
        <Comparison before={item.before} after={item.colours ? `room-${colour}.webp` : item.after} beforeAlt={`${room.label} · ${item.withoutLabel.toLowerCase()}`} afterAlt={`${room.label} · ${item.withLabel.toLowerCase()}${item.colours ? ` in ${colour}` : ''}`} ratio={item.ratio} withLabel={item.withLabel} withoutLabel={item.withoutLabel} split={split} onSplit={setSplit} light={light} onLight={setLight} expanded={expanded} onExpand={() => setExpanded(!expanded)} rug={item.colours} />
        <div className="try-toolbar"><div className="try-views" role="group" aria-label="Comparison view"><MotionButton aria-pressed={split === 100} onClick={() => setSplit(100)}>{item.id === 'kitchen' ? 'With design' : 'With piece'}</MotionButton><MotionButton aria-pressed={split > 0 && split < 100} onClick={() => setSplit(item.split ?? 50)}>Compare</MotionButton><MotionButton aria-pressed={split === 0} onClick={() => setSplit(0)}>{item.id === 'kitchen' ? 'Before design' : 'Without piece'}</MotionButton></div></div>
        <div className="try-actions">
          {product && <SaveButton id={product.id} className="text-link" />}
          <MotionButton className="button" onClick={() => openEnquiry(product?.name ?? item.interest ?? 'Kitchen design')}>{product ? 'Enquire about this piece' : 'Discuss your kitchen'} <Icon /></MotionButton>
          <button type="button" className="text-link share-room-link-btn" onClick={handleShareRoom}>Share room link ↗</button>
        </div>
        <p className="try-feedback" role="status" aria-live="polite" aria-atomic="true">{toastMessage}</p>
        <div className="try-help"><p>Drag the divider to compare with and without the selected piece. Illustrative room studies; lighting is a visual filter.</p><button onClick={() => { setSplit(item.split ?? 50); setLight('day'); }}>Reset view</button></div>
        <RoomConfiguration room={roomId} />
        <FurnitureTray
          items={room.items.map(entry => {
            const p = entry.colours ? products[colour] : entry.product ? products[entry.product] : undefined;
            return {
              id: entry.id,
              name: entry.label,
              finish: p?.palette ?? 'Illustrative design study',
              image: asset(p?.image ?? entry.after),
            };
          })}
          selectedId={item.id}
          onSelect={(option) => selectItem(option.id)}
        />
      </div></div>
    </div>
  </dialog>;
}

