import { roomSlots } from '../data/configuration.ts';
import type { SlotId } from '../data/configuration.ts';
import type { RoomId } from '../data/types.ts';

export type Configuration = { version: 1; rooms: Record<RoomId, Partial<Record<SlotId, string>>> };
export const configurationKey = 'chandani-room-configuration-v1';
export const savedConfigurationKey = 'chandani-saved-room-configuration-v1';

export function defaultConfiguration(): Configuration {
  return { version: 1, rooms: Object.fromEntries(Object.entries(roomSlots).map(([id, slots]) => [id,
    Object.fromEntries(slots.map(slot => [slot.id, slot.defaultVariant])),
  ])) as Configuration['rooms'] };
}

export function selectVariant(state: Configuration, room: RoomId, slotId: SlotId, variantId: string): Configuration {
  const slot = roomSlots[room]?.find(s => s.id === slotId);
  if (!slot?.variants.some(v => v.id === variantId)) return state;
  if (state.rooms[room][slotId] === variantId) return state;
  return { ...state, rooms: { ...state.rooms, [room]: { ...state.rooms[room], [slotId]: variantId } } };
}

/** Validate every saved slot against current content; never trust local storage as catalogue data. */
export function restoreConfiguration(value: unknown): Configuration {
  let result = defaultConfiguration();
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('rooms' in value)) return result;
  const rooms = value.rooms;
  if (!rooms || typeof rooms !== 'object') return result;
  for (const room of Object.keys(roomSlots) as RoomId[]) {
    const selections = (rooms as Record<string, unknown>)[room];
    if (!selections || typeof selections !== 'object') continue;
    for (const slot of roomSlots[room]) {
      const variant = (selections as Record<string, unknown>)[slot.id];
      if (typeof variant === 'string') result = selectVariant(result, room, slot.id, variant);
    }
  }
  return result;
}
