import { roomSlots } from '../data/configuration';
import { getRoomRenderPlan } from '../data/rendering';
import { asset } from '../data/service';
import type { RoomId } from '../data/types';
import { useApp } from '../state/AppContext';

export function RoomConfiguration({ room }: { room: RoomId }) {
  const { configuration, chooseVariant, saveConfiguration, savedConfiguration, restoreSavedConfiguration } = useApp();
  const plan = getRoomRenderPlan(configuration, room);
  const savedPlan = savedConfiguration ? getRoomRenderPlan(savedConfiguration, room) : null;
  return <details className="room-configuration">
    <summary>Keep your room selections</summary>
    <div className="configuration-content"><p>Save the pieces you have selected for each room. This preview offers carpet colours and bare floor with fixed furniture. Additional furniture models are not available yet.</p>
      <dl className="configuration-slots">{roomSlots[room].map(slot => <div key={slot.id}><dt>{slot.label}</dt><dd>
        {slot.variants.length > 1 ? <select aria-label={`${slot.label} selection for ${room}`} value={configuration.rooms[room][slot.id]} onChange={event => chooseVariant(room, slot.id, event.target.value)}>{slot.variants.map(variant => <option value={variant.id} key={variant.id}>{variant.label}</option>)}</select> : slot.variants[0].label}
      </dd></div>)}</dl>
      <figure className="configuration-preview"><img src={asset(plan.image)} alt={plan.alt} loading="lazy" /><figcaption>{plan.view === 'carpet-study' ? 'Carpet study · fixed furniture · a separate view from the homepage room' : 'Room study · sample furniture'}</figcaption></figure>
      {savedPlan && (
        <div className="saved-snapshot-section">
          <span className="eyebrow">SAVED ROOM SNAPSHOT</span>
          <figure className="saved-snapshot-preview">
            <img src={asset(savedPlan.image)} alt={`Saved snapshot for ${room}`} loading="lazy" />
            <figcaption>
              <span>{savedPlan.alt}</span>
              <button type="button" className="text-link" onClick={restoreSavedConfiguration}>Restore snapshot ↵</button>
            </figcaption>
          </figure>
        </div>
      )}
      <div className="configuration-actions"><button className="button outline" onClick={saveConfiguration}>Save room selections</button><button className="button outline" disabled={!savedConfiguration} onClick={restoreSavedConfiguration}>Restore saved selections</button></div>
      <p className="fineprint" role="status">{savedConfiguration ? 'A saved set of room selections is available in this browser.' : 'Your current selections stay in this browser. Save a set to restore it later.'}</p>
    </div>
  </details>;
}
