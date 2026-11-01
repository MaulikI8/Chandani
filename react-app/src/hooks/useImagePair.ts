import { useEffect, useState } from 'react';
import { asset } from '../data/service';

const cache = new Map<string, Promise<void>>();
function preload(name: string) {
  let pending = cache.get(name);
  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => { cache.delete(name); reject(new Error(`Image unavailable: ${name}`)); };
      image.src = asset(name);
    });
    cache.set(name, pending);
  }
  return pending;
}
export function useImagePair(before: string, after: string) {
  const key = `${before}|${after}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: '', attempt: -1, status: 'loading' });
  useEffect(() => {
    let active = true;
    Promise.all([preload(before), preload(after)]).then(
      () => { if (active) setResult({ key, attempt, status: 'ready' }); },
      () => { if (active) setResult({ key, attempt, status: 'error' }); },
    );
    return () => { active = false; };
  }, [before, after, key, attempt]);
  return { status: result.key === key && result.attempt === attempt ? result.status : 'loading', revision: attempt, retry: () => setAttempt(value => value + 1) };
}
