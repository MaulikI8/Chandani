export function readStored(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
export function writeStored(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function validShortlist(value: unknown, ids: string[]): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ids.includes(id)))] : [];
}
