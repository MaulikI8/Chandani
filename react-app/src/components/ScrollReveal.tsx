import { type ReactNode } from 'react';
import { m } from 'motion/react';
import { useMotionPreference } from '../hooks/useMotionPreference';

// Stable component identities: creating a component during render remounts its
// children on updates and can hide an already-visible section.
const elements = { div: m.div, article: m.article };

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof elements;
};

export default function ScrollReveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const reduceMotion = useMotionPreference();
  const MotionComponent = elements[as];

  return (
    <MotionComponent
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionComponent>
  );
}


