/**
 * Adapted from React Bits Glass Surface (SVG renderer), David Haz, 2026.
 * Source and full MIT + Commons Clause terms: docs/REACT-BITS-LICENSE.md.
 * Scoped to a single, static rounded toolbar. No WebGL or animated refraction.
 */
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useMotionPreference } from '../hooks/useMotionPreference';
import './GlassSurface.css';

export function GlassSurface({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `room-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const reduced = useMotionPreference();
  const [supported, setSupported] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    // URL backdrop filters are unreliable in Safari/Firefox; retain the warm
    // frosted fallback there, following React Bits' renderer detection.
    const ua = navigator.userAgent;
    setSupported(!/Firefox/.test(ua) && !(/Safari/.test(ua) && !/Chrome/.test(ua)) && CSS.supports('backdrop-filter', `url(#${id})`));
  }, [id]);
  useEffect(() => {
    const element = ref.current;
    if (!element || reduced || !supported) return;
    const measure = () => setSize(previous => {
      const width = element.offsetWidth, height = element.offsetHeight;
      return previous.width === width && previous.height === height ? previous : { width, height };
    });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [supported, reduced]);
  const map = useMemo(() => {
    const { width: w, height: h } = size;
    if (!w || !h) return undefined;
    const edge = Math.min(w, h) * 0.07;
    // React Bits' rounded gradient displacement map, restrained for photography.
    const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="${w}" height="${h}" fill="black"/>
      <rect width="${w}" height="${h}" rx="12" fill="url(#red)"/>
      <rect width="${w}" height="${h}" rx="12" fill="url(#blue)" style="mix-blend-mode:difference"/>
      <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="12" fill="hsl(0 0% 50% / .93)" filter="url(#soft)"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [size]);
  const refractive = supported && !reduced && !!map;
  return <div ref={ref} className={`room-glass-toolbar glass-surface ${refractive ? 'glass-surface--svg' : 'glass-surface--fallback'}`} style={{ '--glass-filter': `url(#${id})` } as CSSProperties}>
    {refractive && <svg className="glass-surface__filter" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="-14" xChannelSelector="R" yChannelSelector="B" result="dispRed" />
        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="-12" xChannelSelector="R" yChannelSelector="B" result="dispGreen" />
        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="-10" xChannelSelector="R" yChannelSelector="B" result="dispBlue" />
        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
        <feBlend in="red" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blue" mode="screen" result="output" />
        <feGaussianBlur in="output" stdDeviation="0.4" />
      </filter></defs>
    </svg>}
    <div className="glass-surface__content">{children}</div>
  </div>;
}
