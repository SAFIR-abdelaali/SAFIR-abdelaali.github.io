import { useEffect, useLayoutEffect, useSyncExternalStore, type DependencyList, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { savePref } from './prefs';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

/** The same curve as --ease-soft in styles.css, for animations started from script. */
export const EASE_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * full: everything. calm: the OS asks for reduced motion, so small slow loops keep running but
 * smooth scroll, parallax, scrubbing and entrances are off. still: the visitor pressed pause.
 * The head script in index.html sets data-motion before first paint.
 */
export type MotionMode = 'full' | 'calm' | 'still';
const listeners = new Set<() => void>();
export const motionMode = (): MotionMode => (document.documentElement.dataset.motion as MotionMode) ?? 'full';
export const useMotionMode = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    motionMode,
    () => 'full' as MotionMode,
  );
export function togglePause() {
  const pausing = motionMode() !== 'still';
  document.documentElement.dataset.motion = pausing ? 'still' : 'full';
  savePref('motion', pausing ? 'off' : 'on');
  listeners.forEach((fn) => fn());
}
/** True when large motion is off: scroll effects, entrances and view transitions check this. */
export const reducedMotion = () => motionMode() !== 'full';
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;

/** Jump without animating, through Lenis when it is running so its state stays in sync. */
export const scrollToY = (y: number) => {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else scrollTo(0, y);
};

/** Recompute scroll-linked positions after layout changes (show more, fonts, language). */
export const refreshScroll = () => {
  lenis?.resize();
  ScrollTrigger.refresh();
};

/** A left click with no modifier. Any other click on a link should keep its browser meaning, such as a new tab. */
export const isPlainClick = (e: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * Runs `fn` now if fonts are still loading, and again whenever more arrive. The Arabic font only
 * starts downloading after a switch to Arabic, so one check at mount isn't enough. Returns a cleanup.
 */
export function onFontsChange(fn: () => void) {
  document.fonts.ready.then(fn);
  document.fonts.addEventListener('loadingdone', fn);
  return () => document.fonts.removeEventListener('loadingdone', fn);
}

/** Smooth scrolling, in-page links and the pointer light on cards. Mount once. */
export function useMotionSystem() {
  const mode = useMotionMode();

  // Only smooth scrolling depends on the mode; everything below lasts for the whole visit.
  useEffect(() => {
    if (mode !== 'full') return;
    const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, [mode]);

  useEffect(() => {
    window.__booted = true;
    document.documentElement.classList.add('js'); // a slow bundle may arrive after the loader gave up on it
    const cleanups: Array<() => void> = [];

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || !isPlainClick(e)) return;
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(link.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', link.hash);
      if (lenis) lenis.scrollTo(target, { duration: 1.1 } /* Lenis applies scroll-padding-top itself */);
      else target.scrollIntoView();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);
    cleanups.push(() => document.removeEventListener('click', onClick));

    if (finePointer()) {
      let tilted: HTMLElement | null = null;
      const onMove = (e: PointerEvent) => {
        const card = (e.target as Element | null)?.closest?.<HTMLElement>('.card') ?? null;
        if (tilted && tilted !== card) {
          tilted.style.setProperty('--rx', '0deg');
          tilted.style.setProperty('--ry', '0deg');
        }
        tilted = card;
        if (!card) return;
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        if (reducedMotion()) return;
        card.style.setProperty('--ry', `${(x / r.width - 0.5) * 5}deg`);
        card.style.setProperty('--rx', `${(0.5 - y / r.height) * 5}deg`);
      };
      document.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => document.removeEventListener('pointermove', onMove));
    }

    const progress = document.querySelector<HTMLElement>('.scroll-bar');
    if (progress) {
      const trigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          progress.style.transform = `scaleX(${self.progress})`;
        },
      });
      cleanups.push(() => trigger.kill());
    }

    cleanups.push(onFontsChange(refreshScroll));
    addEventListener('load', refreshScroll);
    cleanups.push(() => removeEventListener('load', refreshScroll));

    return () => cleanups.forEach((fn) => fn());
  }, []);
}

/** Adds `is-in` once to each [data-reveal] entering the viewport; CSS does the motion. */
export function useReveals(deps: DependencyList) {
  // Idle loops only run while on screen: `is-live` toggles as these enter and leave.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    });
    document.querySelectorAll('.hero, .portrait, .viz, .techs, .marquee, .beam, .timeline').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    const start = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    const loading = document.documentElement.classList.contains('is-loading');
    if (loading) addEventListener('loader:done', start, { once: true });
    else start();
    return () => {
      removeEventListener('loader:done', start);
      io.disconnect();
    };
  }, deps);
}

/**
 * A scroll-linked GSAP scene scoped to `root`. Reverted and rebuilt when `deps`
 * change (the text and its geometry change with the language). Off for reduced motion.
 */
export function useScene(root: RefObject<HTMLElement | null>, build: (scope: HTMLElement) => void, deps: DependencyList) {
  const mode = useMotionMode();
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => build(el), el);
    return () => ctx.revert();
  }, [...deps, mode]);
}

/** Fades or wipes between two document states. Falls back to an instant change. */
export function runViewTransition(kind: 'theme' | 'lang', update: () => void, origin?: { x: number; y: number }) {
  const html = document.documentElement;
  if (!document.startViewTransition || reducedMotion() || document.hidden) {
    update();
    return;
  }
  html.dataset.vt = kind;
  const vt = document.startViewTransition(update);
  if (origin) {
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    vt.ready
      .then(() => {
        html.animate(
          { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
          { duration: 700, easing: EASE_SOFT, pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  }
  vt.finished.finally(() => delete html.dataset.vt).catch(() => {});
}

export { gsap, ScrollTrigger };
