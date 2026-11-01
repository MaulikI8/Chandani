import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { m } from 'motion/react';
import { useMotionPreference } from '../hooks/useMotionPreference';

type ImageProps = Pick<ImgHTMLAttributes<HTMLImageElement>, 'id' | 'className' | 'width' | 'height' | 'fetchPriority'> & { src: string; alt: string };

export function CrossfadeImage({ ready, revision = 0, ...props }: ImageProps & { ready: boolean; revision?: number }) {
  const reduced = useMotionPreference();
  const [lastReady, setLastReady] = useState(props);
  const [outgoing, setOutgoing] = useState<ImageProps | null>(null);
  if (ready && lastReady.src !== props.src) {
    setOutgoing(reduced ? null : lastReady);
    setLastReady(props);
  }
  useEffect(() => {
    if (reduced) setOutgoing(null);
  }, [reduced]);
  // The actual photograph is a plain, visible image. Only the decorative old
  // image fades away, so animation startup can never leave the room invisible.
  // The loader still gates new sources and rejects stale/error results.
  const displayed = ready ? props : lastReady;
  return <>
    <img key={revision} {...displayed} />
    {ready && !reduced && outgoing && <m.img key={`${outgoing.src}-${displayed.src}-${revision}`} {...outgoing} id={undefined} alt="" aria-hidden="true"
      initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.24 }}
      style={{ pointerEvents: 'none' }}
      onAnimationComplete={() => setOutgoing(current => current === outgoing ? null : current)} />}
  </>;
}
