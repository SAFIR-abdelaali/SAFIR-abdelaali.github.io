import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { finePointer, gsap, useMotionMode } from '../lib/motion';

export const GITHUB = 'https://github.com/SAFIR-abdelaali';

export const delay = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/** Splits text into separately styled words. Whole words only, so Arabic stays joined. */
export const eachWord = (text: string, render: (word: string, i: number) => ReactNode) =>
  text.split(/\s+/).map((word, i) => (
    <span key={i}>
      {i > 0 && ' '}
      {render(word, i)}
    </span>
  ));

/** Text whose words rise through a mask when it enters the viewport. */
export function Words({ text, as: Tag = 'span', className, d }: { text: string; as?: ElementType; className?: string; d?: number }) {
  return (
    <Tag className={className} data-reveal="words" style={d ? delay(d) : undefined}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" key={text}>
        {eachWord(text, (word, i) => (
          <span className="w">
            <span style={{ '--i': i } as CSSProperties}>{word}</span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

/** Pulls its child slightly toward the pointer. Lives on a wrapper so the child's own hover scale is untouched. */
export function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mode = useMotionMode();
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== 'full' || !finePointer()) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 }); // pausing mid-hover mustn't leave it pulled aside
    };
  }, [strength, mode]);
  return (
    <span className="magnet" ref={ref}>
      {children}
    </span>
  );
}

export const Chevron = () => (
  <svg className="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
);

/** The diagonal arrow on links that leave the site. */
export const Arrow = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l6-6M4 3h5v5" />
  </svg>
);

/** A mark from the logo sprite, public/assets/logos.svg. */
export const Logo = ({ icon }: { icon: string }) => (
  <svg className="logo" aria-hidden="true">
    <use href={`/assets/logos.svg#i-${icon}`} />
  </svg>
);

export const Icon = ({ children }: { children: ReactNode }) => (
  <div className="icon">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  </div>
);

export const Chips = ({ items }: { items: readonly string[] }) => (
  <ul className="chips">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);
