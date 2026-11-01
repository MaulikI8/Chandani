import './RoomToolbar.css';

export default function RoomToolbar({ onReset, onSave }: { onReset: () => void; onSave: () => void }) {
  return <div className="room-view-actions" role="group" aria-label="Room view actions">
    <button type="button" className="text-link" onClick={onReset} aria-label="Reset room view">Reset view</button>
    <button type="button" className="text-link" onClick={onSave}>Save room selections <span aria-hidden="true">↗</span></button>
  </div>;
}
