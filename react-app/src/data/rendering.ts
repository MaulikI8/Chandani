import type { Configuration } from '../state/configuration';
import type { RoomId } from './types';

export type RoomRenderPlan = { kind: 'flat-study'; image: string; alt: string; view: 'carpet-study' | 'room-study' };

/** Capability-limited renderer: these are opaque studies, never independently composited models. */
export function getRoomRenderPlan(configuration: Configuration, room: RoomId): RoomRenderPlan {
  if (room === 'living') {
    const carpet = configuration.rooms.living.carpet;
    return { kind: 'flat-study', image: carpet === 'bare' ? 'room-empty.webp' : `room-${carpet}.webp`,
      alt: carpet === 'bare' ? 'Carpet study with bare floor and fixed furniture' : `Carpet study with ${carpet} carpet and fixed furniture`, view: 'carpet-study' };
  }
  return { kind: 'flat-study', image: `${room}.webp`, alt: `${room} room study with the sample furniture`, view: 'room-study' };
}
