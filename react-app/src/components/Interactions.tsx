import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, useAnimationControls, useInView, type HTMLMotionProps } from 'motion/react';
import { useMotionPreference } from '../hooks/useMotionPreference';

export function InteractionProvider({ children }: { children: ReactNode }) {
  const reduced = useMotionPreference();
  return <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}>
    <LazyMotion features={domAnimation} strict>{children}</LazyMotion>
  </MotionConfig>;
}

export function MotionButton({ ref, ...props }: HTMLMotionProps<'button'> & { ref?: Ref<HTMLButtonElement> }) {
  const reduced = useMotionPreference();
  return <m.button type="button" {...props} ref={ref} whileHover={reduced || props.disabled ? undefined : { y: -2, transition: { duration: 0.16 } }} whileTap={reduced || props.disabled ? undefined : { scale: 0.97, transition: { duration: 0.1 } }} transition={{ duration: reduced ? 0 : 0.2 }} />;
}

export function RevealSection(props: Pick<HTMLMotionProps<'section'>, 'children' | 'className' | 'id' | 'aria-label'>) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const controls = useAnimationControls();
  const reduced = useMotionPreference();
  const revealed = useRef(false);
  useEffect(() => {
    if (reduced) {
      controls.set({ opacity: 1, y: 0 });
    } else if (inView && !revealed.current) {
      revealed.current = true;
      if (!ref.current?.contains(document.activeElement)) {
        void controls.start({ opacity: [0.82, 1], y: [10, 0], transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } });
      }
    }
    return () => controls.stop();
  }, [inView, reduced, controls]);
  // Content is visible before intersection detection, in SSR, and on keyboard
  // entry. Animation never gates navigation, focus or access to the content.
  return <m.section {...props} ref={ref} initial={false} animate={controls} onFocusCapture={() => {
    revealed.current = true;
    controls.stop(); controls.set({ opacity: 1, y: 0 });
  }} />;
}

