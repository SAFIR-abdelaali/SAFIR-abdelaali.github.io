/**
 * The page's background life: small motes and 0s and 1s drifting slowly upward behind
 * everything. They shift with scroll for depth and part gently around the pointer. The flare
 * element trails the cursor. Pauses with the tab or the pause button.
 */

import { finePointer, motionMode } from './motion';

type Mote = { x: number; y: number; r: number; vx: number; vy: number; depth: number; phase: number; glyph: string };

const TAU = Math.PI * 2;

const FLARE_SIZE = 720;

export function startAmbient(canvas: HTMLCanvasElement, flare: HTMLElement) {
  const ctx = canvas.getContext('2d')!;
  const html = document.documentElement;
  const still = () => motionMode() === 'still';

  let W = 0, H = 0;
  let motes: Mote[] = [];
  let soft = '', accent = '';
  let raf = 0, last = 0, lastScroll = scrollY;
  let px = -9999, py = -9999, glowX = -9999, glowY = -9999;
  const hasPointer = finePointer();

  const readColors = () => {
    const css = getComputedStyle(html);
    soft = css.getPropertyValue('--c-soft').trim();
    accent = css.getPropertyValue('--c-accent').trim();
  };

  const make = (): Mote => {
    const depth = 0.35 + Math.random() * 0.65;
    const glyphChance = Math.random();
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: (0.9 + Math.random() * 1.6) * depth,
      vx: (Math.random() - 0.5) * 5,
      vy: -(5 + Math.random() * 11) * depth,
      depth,
      phase: Math.random() * TAU,
      glyph: glyphChance < 0.16 ? '0' : glyphChance < 0.32 ? '1' : '',
    };
  };

  const size = () => {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.max(18, Math.min(64, (W * H) / 30000)));
    while (motes.length < target) motes.push(make());
    motes.length = target;
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const t = now / 1000;
    const scrolled = scrollY - lastScroll;
    lastScroll = scrollY;

    ctx.clearRect(0, 0, W, H);

    if (hasPointer && px > -999) {
      if (glowX < -999) { glowX = px; glowY = py; }
      glowX += (px - glowX) * Math.min(1, dt * 5);
      glowY += (py - glowY) * Math.min(1, dt * 5);
      flare.style.transform = `translate3d(${glowX - FLARE_SIZE / 2}px, ${glowY - FLARE_SIZE / 2}px, 0)`;
    }

    ctx.font = '600 11px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    for (const m of motes) {
      m.x += (m.vx + Math.sin(t * 0.4 + m.phase) * 4) * dt;
      m.y += m.vy * dt - scrolled * m.depth * 0.22;

      const dx = m.x - px, dy = m.y - py, d = Math.hypot(dx, dy);
      if (d < 130 && d > 0) {
        const push = (1 - d / 130) * 34 * dt;
        m.x += (dx / d) * push;
        m.y += (dy / d) * push;
      }

      if (m.y < -14) { m.y = H + 12; m.x = Math.random() * W; }
      else if (m.y > H + 14) { m.y = -12; m.x = Math.random() * W; }
      if (m.x < -14) m.x = W + 12;
      else if (m.x > W + 14) m.x = -12;

      const twinkle = 0.5 + 0.5 * Math.sin(t * 0.9 + m.phase);
      ctx.globalAlpha = (0.1 + twinkle * 0.26) * m.depth;
      ctx.fillStyle = m.depth > 0.8 ? accent : soft;
      if (m.glyph) {
        ctx.fillText(m.glyph, m.x, m.y);
      } else {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (!document.hidden && !still()) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  };

  const kick = () => {
    if (!raf && !document.hidden && !still()) {
      last = performance.now();
      lastScroll = scrollY;
      raf = requestAnimationFrame(frame);
    }
  };
  const onPointer = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    flare.classList.add('is-on');
  };
  const onLeave = () => flare.classList.remove('is-on');
  const onResize = () => size();

  const watch = new MutationObserver(() => {
    readColors();
    if (still()) ctx.clearRect(0, 0, W, H);
    kick();
  });
  watch.observe(html, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  readColors();
  size();
  kick();

  return () => {
    cancelAnimationFrame(raf);
    watch.disconnect();
    removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', kick);
    document.removeEventListener('pointermove', onPointer);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  };
}
