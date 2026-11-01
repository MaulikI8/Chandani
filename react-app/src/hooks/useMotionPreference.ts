import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(callback: () => void) {
  const preference = window.matchMedia(query);
  preference.addEventListener('change', callback);
  return () => preference.removeEventListener('change', callback);
}
const snapshot = () => window.matchMedia(query).matches;

// Subscribe explicitly: the installed Motion useReducedMotion hook snapshots its
// initial value. This also stops opacity effects when the OS setting changes.
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
