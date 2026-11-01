import { useEffect, useId, useRef, type CSSProperties } from 'react';
import type { Light } from '../data/types';
import { asset } from '../data/service';
import { useImagePair } from '../hooks/useImagePair';
import { CrossfadeImage } from './CrossfadeImage';
import { GlassSurface } from './GlassSurface';
import { MotionButton } from './Interactions';

export type ComparisonProps = {
  before: string; after: string; beforeAlt: string; afterAlt: string; ratio: number;
  withLabel: string; withoutLabel: string; split: number; onSplit: (value: number) => void;
  light: Light; onLight?: (value: Light) => void; expanded: boolean; onExpand: () => void; studio?: boolean; sceneLabel?: string; rug?: boolean;
};
export function Comparison({ before, after, beforeAlt, afterAlt, ratio, withLabel, withoutLabel, split, onSplit, light, onLight, expanded, onExpand, studio = false, sceneLabel, rug }: ComparisonProps) {
  const { status, revision, retry } = useImagePair(before, after);
  const instructionsId = useId();
  const slider = useRef<HTMLInputElement>(null);
  const retryFocus = useRef<string | null>(null);
  const imagePair = `${before}|${after}`;
  useEffect(() => {
    if (retryFocus.current !== imagePair) retryFocus.current = null;
    if (status === 'ready' && retryFocus.current === imagePair) {
      retryFocus.current = null;
      const active = document.activeElement;
      // A successful retry should not steal focus if the user has moved on.
      if (active === document.body || active === slider.current?.closest('dialog') || active?.closest('.try-loading')) {
        slider.current?.focus({ preventScroll: true });
      }
    }
  }, [status, imagePair]);
  const expandButton = <MotionButton className={studio ? 'expand-button' : 'try-expand'} onClick={onExpand} aria-label={expanded ? 'Close expanded room comparison' : 'Expand room comparison'} aria-expanded={expanded}>{expanded ? (studio ? 'Close expanded view ↙' : 'Shrink ↙') : 'Expand ↗'}</MotionButton>;
  const floatingControls = !studio && !!onLight;
  const valueText = split === 100 ? withLabel : split === 0 ? withoutLabel : `${split}% ${withLabel.toLowerCase()}, ${100 - split}% ${withoutLabel.toLowerCase()}`;
  return <div className={studio ? 'comparison' : 'try-stage'} id={studio ? (expanded ? 'expandedComparison' : 'comparison') : 'tryStage'} data-light={light} data-shape={rug ? 'rug' : 'wide'} style={{ '--split': `${split}%`, '--try-split': `${split}%`, '--try-ratio': ratio } as CSSProperties}>
    <div className={studio ? 'comparison-image' : 'try-frame'}>
      <CrossfadeImage ready={status === 'ready'} revision={revision} src={asset(before)} alt={beforeAlt} />
      <CrossfadeImage ready={status === 'ready'} revision={revision} className={studio ? 'comparison-after' : 'try-after'} src={asset(after)} alt={afterAlt} />
      <div className={studio ? 'comparison-line' : 'try-divider'} hidden={split === 0 || split === 100} aria-hidden="true"><span>↔</span></div>
      <input ref={slider} type="range" min="0" max="100" step="1" value={split} disabled={status !== 'ready'} onChange={e => onSplit(Number(e.target.value))} aria-label={studio ? 'Reveal the carpet' : `Compare ${withLabel.toLowerCase()} and ${withoutLabel.toLowerCase()}`} aria-describedby={!studio ? instructionsId : undefined} aria-valuetext={valueText} />
      <div className={studio ? 'comparison-labels' : 'try-image-labels'}><span hidden={split === 0}>{withLabel}</span><span hidden={split === 100}>{withoutLabel}</span></div>
      {sceneLabel && <span className="rug-scene-label">{sceneLabel}</span>}
      {status !== 'ready' && <div className="try-loading" role="status" aria-live="polite" aria-atomic="true"><span>{status === 'error' ? 'This room preview could not load. Please try again.' : 'Loading comparison…'}</span>{status === 'error' && <button onClick={() => { retryFocus.current = imagePair; retry(); }}>Try again</button>}</div>}
      {!floatingControls && expandButton}
    </div>
    {floatingControls && <GlassSurface>
      <div className="try-lights" role="group" aria-label="Preview lighting">
        <MotionButton aria-pressed={light === 'day'} onClick={() => onLight!('day')}>Day</MotionButton>
        <MotionButton aria-pressed={light === 'evening'} onClick={() => onLight!('evening')}>Evening</MotionButton>
      </div>
      {expandButton}
    </GlassSurface>}
    {!studio && (
      <div className="comparison-adjust">
        <div className="comparison-steps" role="group" aria-label="Adjust comparison">
          <button type="button" aria-label={`Show less: ${withLabel}`} disabled={status !== 'ready' || split === 0} onClick={() => onSplit(Math.max(0, split - 10))}>−</button>
          <output aria-live="off">{split}% {withLabel.toLowerCase()}</output>
          <button type="button" aria-label={`Show more: ${withLabel}`} disabled={status !== 'ready' || split === 100} onClick={() => onSplit(Math.min(100, split + 10))}>+</button>
        </div>
        <p id={instructionsId}>Drag the divider or use − / +. With the divider focused, use arrow keys to adjust, Home for {withoutLabel.toLowerCase()} and End for {withLabel.toLowerCase()}.</p>
      </div>
    )}
  </div>;
}
