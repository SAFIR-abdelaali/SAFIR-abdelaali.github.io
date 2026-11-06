/**
 * Hero animation. Data characters drop from the Ingest pipe, walk through Store,
 * Transform (scruffy to tidy) and Warehouse (tidy to bright), then jump into the
 * Visualize dashboard and raise a bar. In RTL the whole scene mirrors, so data
 * flows with the reading direction; only the labels are drawn unmirrored.
 */

import { motionMode } from './motion';

type Character = {
  x: number; h: number; v: number; stage: number; state: 'fall' | 'walk' | 'hop' | 'gone';
  speed: number; gait: number; seed: number; squash: number; blinkIn: number; blink: number;
  hop: number; x0: number; h0: number; bar: number;
};
type Pop = { x: number; y: number; vx: number; vy: number; life: number };
/** Rising 0s and 1s, or a soft puff of steam when `ch` is empty. */
type Bit = { x: number; y: number; vx: number; vy: number; life: number; max: number; ch: string };

const SLOTS = [0.09, 0.29, 0.5, 0.71, 0.905];
const TAU = Math.PI * 2;

export type Pipeline = { setLabels: (labels: string[]) => void; setRtl: (rtl: boolean) => void; destroy: () => void };

export function startPipeline(hero: HTMLElement, canvas: HTMLCanvasElement, initial: { labels: string[]; rtl: boolean }): Pipeline {
  const ctx = canvas.getContext('2d')!;
  const still = () => motionMode() === 'still';

  let labels = initial.labels;
  let rtl = initial.rtl;
  let W = 0, H = 0, s = 1, floor = 0, X: number[] = [];
  let chars: Character[] = [], pops: Pop[] = [], bits: Bit[] = [], time = 1, spawnIn = 0, gearTurn = 0, bitIn = 0, puffIn = 0;
  let mx = -9999, my = -9999;
  const bars = [0.35, 0.55, 0.42, 0.7, 0.5];
  const shown = bars.slice();
  const busy = [0, 0, 0, 0, 0];
  const pulse = [0, 0, 0, 0, 0]; // each station wobbles when data passes through
  let storeLevel = 0.5;

  // Colors come from the theme tokens and are re-read when the theme changes.
  const colors = { base: '', raised: '', mid: '', soft: '', accent: '', fg: '', onAccent: '', light: false, font: '' };
  const readColors = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    colors.base = v('--c-base'); colors.raised = v('--c-raised'); colors.mid = v('--c-mid');
    colors.soft = v('--c-soft'); colors.accent = v('--c-accent'); colors.fg = v('--c-fg');
    colors.onAccent = v('--c-on-accent');
    colors.light = document.documentElement.dataset.theme === 'light';
    colors.font = getComputedStyle(document.body).fontFamily;
  };

  const dot = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const burst = (x: number, y: number, count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      pops.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.55 });
    }
  };

  const size = () => {
    const oldW = W;
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s = Math.max(0.56, Math.min(1.38, W / 1180, H / 620));
    // Below the nav breakpoint the links float at the bottom, so the belt sits above them.
    floor = H - Math.max(40, 52 * s) - (W < 900 ? 72 : 0);
    X = SLOTS.map((f) => f * W);
    if (oldW && oldW !== W) chars.forEach((c) => { c.x *= W / oldW; });
  };

  const make = (x: number, h: number, stage: number, state: Character['state']): Character => ({
    x, h, v: 0, stage, state,
    speed: 54 + Math.random() * 18,
    gait: Math.random() * TAU,
    seed: Math.random() * TAU,
    squash: 0, blinkIn: 1 + Math.random() * 4, blink: 0, hop: 0, x0: 0, h0: 0, bar: 0,
  });
  const spawn = () => { if (chars.length < 22) { chars.push(make(X[0], 66 * s, 0, 'fall')); pulse[0] = 1; } };
  const stageAt = (x: number) => (x > X[3] ? 2 : x > X[2] ? 1 : 0);
  const seedWalkers = () => {
    chars = [];
    const span = X[4] - X[0] - 90 * s;
    for (let i = 0; i < 12; i++) {
      const x = X[0] + 30 * s + (i / 12) * span;
      chars.push(make(x, 0, stageAt(x), 'walk'));
    }
  };

  /* ── simulation ── */
  const startHop = (c: Character) => {
    c.state = 'hop'; c.hop = 0; c.x0 = c.x; c.h0 = c.h;
    c.bar = Math.floor(Math.random() * bars.length);
  };
  const barX = (i: number) => X[4] + (-37 + i * 18.5) * s;
  const update = (dt: number) => {
    time += dt;
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = 1.15 + Math.random() * 0.6; }
    busy.fill(0);
    for (let i = 0; i < pulse.length; i++) pulse[i] = Math.max(0, pulse[i] - dt * 2.4);
    storeLevel = Math.max(0.3, storeLevel - dt * 0.012);

    chars.forEach((c) => {
      c.blinkIn -= dt;
      if (c.blinkIn <= 0) { c.blink = 0.14; c.blinkIn = 2 + Math.random() * 4; }
      c.blink = Math.max(0, c.blink - dt);
      c.squash = Math.max(0, c.squash - dt * 4.5);

      if (c.state === 'hop') {
        c.hop += dt / 0.72;
        if (c.hop >= 1) {
          c.state = 'gone';
          bars[c.bar] = Math.min(1, bars[c.bar] + 0.2);
          pulse[4] = 1;
          burst(barX(c.bar), floor - 22 * s - bars[c.bar] * 50 * s, 7, 42);
        }
        return;
      }

      c.v -= 760 * s * dt;
      c.h = Math.max(0, c.h + c.v * dt);
      if (c.h === 0 && c.v < 0) {
        if (c.v < -90 * s) c.squash = 1;
        c.v = 0;
        if (c.state === 'fall') c.state = 'walk';
      }
      if (c.state !== 'walk') return;

      const near = Math.hypot(c.x - mx, floor - c.h - my) < 80 * s;
      const before = c.x;
      c.x += c.speed * s * dt * (near ? 0.45 : 1);
      for (let i = 1; i < 4; i++) {
        if (before < X[i] && c.x >= X[i]) {
          pulse[i] = 1;
          if (i === 1) storeLevel = Math.min(0.92, storeLevel + 0.07);
        }
      }
      c.gait += dt * 9;
      if (c.h === 0 && Math.random() < dt * (near ? 1.3 : 0.2)) c.v = (150 + Math.random() * 70) * s;

      const reached = stageAt(c.x);
      if (reached > c.stage) burst(c.x, floor - 26 * s, 9, 58); // promoted: a small burst as it comes out of the machine
      c.stage = Math.max(c.stage, reached);
      for (let i = 1; i < 4; i++) if (Math.abs(c.x - X[i]) < 42 * s) busy[i] = 1;
      if (c.x >= X[4] - 92 * s) startHop(c);
    });
    chars = chars.filter((c) => c.state !== 'gone');

    for (let i = 0; i < bars.length; i++) {
      bars[i] = Math.max(0.16, bars[i] - dt * 0.022);
      shown[i] += (bars[i] - shown[i]) * Math.min(1, dt * 7);
    }
    pops.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    pops = pops.filter((p) => p.life > 0);

    // 0s and 1s drift up off the stations; the Transform machine lets off steam while it works.
    bitIn -= dt;
    if (bitIn <= 0) {
      bitIn = 0.32 + Math.random() * 0.3;
      const i = Math.floor(Math.random() * 5);
      bits.push({ x: X[i] + (Math.random() - 0.5) * 60 * s, y: floor - (i === 0 ? 132 : 96) * s, vx: (Math.random() - 0.5) * 8, vy: -(16 + Math.random() * 14), life: 2.6, max: 2.6, ch: Math.random() < 0.5 ? '0' : '1' });
    }
    puffIn -= dt;
    if (puffIn <= 0) {
      puffIn = busy[2] ? 0.2 : 0.7;
      bits.push({ x: X[2] + 26 * s, y: floor - 86 * s, vx: 4 + Math.random() * 6, vy: -(14 + Math.random() * 10), life: 1.8, max: 1.8, ch: '' });
    }
    bits.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
    bits = bits.filter((b) => b.life > 0);
  };

  /* ── drawing ── */
  const rr = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const panel = (x: number, y: number, w: number, h: number, r: number) => {
    rr(x, y, w, h, r);
    ctx.fillStyle = colors.raised; ctx.fill();
    ctx.strokeStyle = colors.soft; ctx.lineWidth = 1.6; ctx.stroke();
  };

  const drawBelt = () => {
    ctx.strokeStyle = colors.soft; ctx.lineWidth = 2;
    ctx.globalAlpha = 0.42;
    ctx.beginPath(); ctx.moveTo(0, floor + 3); ctx.lineTo(W, floor + 3); ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.setLineDash([3, 13]); ctx.lineDashOffset = -time * 34;
    ctx.beginPath(); ctx.moveTo(0, floor + 9); ctx.lineTo(W, floor + 9); ctx.stroke();
    ctx.setLineDash([]);
    // data gliding along the belt
    ctx.fillStyle = colors.soft; ctx.globalAlpha = 0.6;
    for (let k = 0; k < 9; k++) {
      rr(((time * 34 + (k * W) / 9) % (W + 10)) - 5, floor + 7, 5, 4, 1.5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /** Dotted arcs overhead connect the stations, with packets travelling along them. */
  const drawBus = () => {
    const top = (i: number) => floor - (i === 0 ? 128 : i === 4 ? 104 : 86) * s;
    for (let i = 0; i < 4; i++) {
      const ax = X[i], ay = top(i), bx = X[i + 1], by = top(i + 1);
      const cx = (ax + bx) / 2, cy = Math.min(ay, by) - 46 * s;
      ctx.strokeStyle = colors.soft; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.28;
      ctx.setLineDash([2, 7]); ctx.lineDashOffset = -time * 16;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, bx, by); ctx.stroke();
      ctx.setLineDash([]);
      for (let k = 0; k < 2; k++) {
        const t = (time * 0.2 + k / 2 + i * 0.17) % 1, u = 1 - t;
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by, 2.6 * s, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  /** Stations breathe gently, and wobble like a spring when data passes through. */
  const station = (i: number, x: number, paint: () => void) => {
    const wobble = Math.sin(pulse[i] * 9) * pulse[i] * 0.07;
    const breath = Math.sin(time * 1.5 + i * 1.3) * 0.009;
    ctx.save();
    ctx.translate(x, floor);
    ctx.scale(1 + wobble - breath, 1 - wobble + breath);
    ctx.translate(-x, -floor);
    paint();
    ctx.restore();
  };

  const drawBits = () => {
    ctx.textAlign = 'center';
    ctx.font = `600 ${Math.max(10, 11 * s)}px ui-monospace, Consolas, monospace`;
    bits.forEach((b) => {
      const k = b.life / b.max;
      if (b.ch) {
        ctx.save();
        ctx.translate(b.x, b.y);
        if (rtl) ctx.scale(-1, 1); // the scene is mirrored, digits must not be
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.55;
        ctx.fillStyle = colors.soft;
        ctx.fillText(b.ch, 0, 0);
        ctx.restore();
      } else {
        ctx.globalAlpha = k * 0.3;
        ctx.fillStyle = colors.soft;
        dot(b.x, b.y, (2 + (1 - k) * 7) * s);
      }
    });
    ctx.globalAlpha = 1;
  };

  const drawIngest = (x: number) => {
    const top = floor - 128 * s, mouth = floor - 70 * s;
    // feed arriving from the edge of the page
    ctx.strokeStyle = colors.soft; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 8]); ctx.lineDashOffset = -time * 30;
    ctx.beginPath(); ctx.moveTo(0, top + 12 * s); ctx.lineTo(x - 18 * s, top + 12 * s); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // packets on the feed
    ctx.fillStyle = colors.accent;
    for (let k = 0; k < 4; k++) {
      const t = (time * 0.3 + k / 4) % 1;
      ctx.globalAlpha = Math.min(1, (1 - t) * 6);
      rr(t * (x - 18 * s) - 3 * s, top + 9 * s, 6 * s, 6 * s, 1.5 * s);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    panel(x - 18 * s, top, 36 * s, mouth - top, 7 * s);
    // the nozzle opens just before a character drops
    const open = spawnIn < 0.3 ? (0.3 - spawnIn) / 0.3 : 0;
    panel(x - (25 + open * 5) * s, mouth - 9 * s, (50 + open * 10) * s, 14 * s, 5 * s);
    // a row of activity lights
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.sin(time * 3.2 - k * 0.9));
      ctx.fillStyle = colors.accent;
      dot(x - 9 * s + k * 9 * s, top + 16 * s, 2.3 * s);
    }
    ctx.globalAlpha = 1;
    // a turning valve
    ctx.save(); ctx.translate(x, top + 36 * s); ctx.rotate(time * 1.4);
    ctx.strokeStyle = colors.soft; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(0, 0, 7 * s, 0, TAU);
    ctx.moveTo(-7 * s, 0); ctx.lineTo(7 * s, 0); ctx.moveTo(0, -7 * s); ctx.lineTo(0, 7 * s);
    ctx.stroke();
    ctx.restore();
  };

  const drawStore = (x: number, on: number) => {
    const w = 74 * s, h = 80 * s, y = floor - h, ry = 11 * s;
    const tankPath = () => {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + ry); ctx.lineTo(x - w / 2, floor);
      ctx.lineTo(x + w / 2, floor); ctx.lineTo(x + w / 2, y + ry);
      ctx.ellipse(x, y + ry, w / 2, ry, 0, 0, Math.PI, true);
      ctx.closePath();
    };
    ctx.fillStyle = colors.raised; ctx.strokeStyle = on ? colors.accent : colors.soft; ctx.lineWidth = 1.6;
    tankPath(); ctx.fill();
    // the tank fills as data arrives, with a slow wave on the surface and bubbles rising
    ctx.save();
    ctx.clip();
    const surface = floor - h * storeLevel;
    ctx.fillStyle = colors.mid; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(x - w / 2, floor);
    for (let i = 0; i <= 16; i++) {
      const px = x - w / 2 + (i / 16) * w;
      ctx.lineTo(px, surface + Math.sin(i * 0.8 + time * 2.2) * 2.4 * s + pulse[1] * Math.sin(i * 1.6 - time * 8) * 3 * s);
    }
    ctx.lineTo(x + w / 2, floor); ctx.closePath(); ctx.fill();
    ctx.fillStyle = colors.fg; ctx.globalAlpha = 0.35;
    for (let k = 0; k < 5; k++) {
      const t = (time * 0.24 + k * 0.21) % 1;
      dot(x + Math.sin(k * 2.4 + time) * w * 0.3, floor - t * h * storeLevel, (1 + (k % 3) * 0.6) * s);
    }
    ctx.restore();
    ctx.strokeStyle = on ? colors.accent : colors.soft;
    tankPath(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + ry, w / 2, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = colors.mid;
    [32, 54].forEach((d) => { ctx.beginPath(); ctx.ellipse(x, y + d * s, w / 2, ry, 0, 0.12, Math.PI - 0.12); ctx.stroke(); });
  };

  const drawGear = (x: number, y: number, r: number, turn: number, color: string) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(turn);
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.3; ctx.lineCap = 'butt';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(r * 0.8, 0); ctx.lineTo(r * 1.26, 0); ctx.stroke();
      ctx.rotate(TAU / 8);
    }
    ctx.lineWidth = r * 0.34;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, TAU); ctx.stroke();
    ctx.restore(); ctx.lineCap = 'round';
  };
  const drawTransform = (x: number, on: number) => {
    const w = 92 * s, h = 84 * s;
    const shake = on ? Math.sin(time * 34) * 0.7 * s : 0;
    panel(x - w / 2 + shake, floor - h, w, h, 13 * s);
    drawGear(x - 13 * s + shake, floor - h * 0.6, 15 * s, gearTurn, on ? colors.accent : colors.soft);
    drawGear(x + 16 * s + shake, floor - h * 0.38, 10 * s, -gearTurn * 1.5 + 0.2, colors.mid);
    drawGear(x + 26 * s + shake, floor - h * 0.76, 6 * s, gearTurn * 2.5, colors.soft);
    // progress bar along the bottom
    const bw = w - 22 * s;
    rr(x - bw / 2 + shake, floor - 11 * s, bw, 4 * s, 2 * s);
    ctx.fillStyle = colors.mid; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
    rr(x - bw / 2 + shake, floor - 11 * s, Math.max(4 * s, bw * ((time * 0.45) % 1)), 4 * s, 2 * s);
    ctx.fillStyle = colors.accent; ctx.fill();
  };

  const drawWarehouse = (x: number) => {
    const w = 88 * s, h = 86 * s, y = floor - h;
    panel(x - w / 2, y, w, h, 12 * s);
    [colors.accent, colors.soft, colors.mid].forEach((color, i) => {
      const rx = x - w / 2 + 10 * s, ry = y + (10 + i * 25) * s, rw = w - 20 * s, rh = 17 * s;
      rr(rx, ry, rw, rh, 5 * s);
      ctx.fillStyle = color; ctx.fill();
      // a light sweeps along each shelf, and its status light blinks
      ctx.save();
      ctx.clip();
      const sweep = rx - 24 * s + (((time * 0.42 + i * 0.27) % 1.5) / 1.5) * (rw + 48 * s);
      ctx.fillStyle = colors.raised; ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.moveTo(sweep, ry); ctx.lineTo(sweep + 14 * s, ry); ctx.lineTo(sweep + 4 * s, ry + rh); ctx.lineTo(sweep - 10 * s, ry + rh);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = i === 2 ? colors.fg : colors.base;
      ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(time * 2.4 + i * 2));
      dot(rx + rw - 8 * s, ry + rh / 2, 2.2 * s);
      ctx.globalAlpha = 1;
    });
  };

  const drawVisualize = (x: number) => {
    const w = 112 * s, h = 84 * s, y = floor - h - 20 * s;
    ctx.strokeStyle = colors.soft; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, floor); ctx.moveTo(x - 20 * s, floor); ctx.lineTo(x + 20 * s, floor); ctx.stroke();
    panel(x - w / 2, y, w, h, 11 * s);
    const base = y + h - 9 * s;
    const top = Math.max(...shown);
    shown.forEach((v, i) => {
      const bh = Math.max(0.1, v + Math.sin(time * 1.5 + i * 1.2) * 0.05) * 52 * s;
      rr(barX(i) - 6 * s, base - bh, 12 * s, bh, 3 * s);
      ctx.fillStyle = v === top ? colors.accent : colors.soft;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    // a live line scrolling across the screen, with a pulsing head
    const lineAt = (j: number) => y + 15 * s + (Math.sin(time * 1.5 - j * 0.75) + Math.sin(time * 0.8 - j * 1.6) * 0.5) * 5 * s;
    ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let j = 0; j <= 14; j++) {
      const px = x - w / 2 + 9 * s + (j / 14) * (w - 18 * s);
      if (j) ctx.lineTo(px, lineAt(j)); else ctx.moveTo(px, lineAt(j));
    }
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.25;
    dot(x + w / 2 - 9 * s, lineAt(14), (3 + (Math.sin(time * 4) + 1) * 2) * s);
    ctx.globalAlpha = 1;
    dot(x + w / 2 - 9 * s, lineAt(14), 2.2 * s);
  };

  const drawChar = (c: Character) => {
    let px = c.x, h = c.h, grow = 1;
    const stage = c.stage;
    if (c.state === 'hop') {
      const t = c.hop, target = barX(c.bar);
      px = c.x0 + (target - c.x0) * t;
      h = c.h0 + 70 * s * t + Math.sin(t * Math.PI) * 58 * s;
      grow = 1 - t * 0.7;
    }
    const r = 12 * Math.max(s, 0.68) * grow;
    const moving = c.state === 'walk' && c.h === 0;
    const bob = moving ? Math.abs(Math.sin(c.gait)) * 1.6 * s : 0;
    const sq = c.squash, sx = 1 + sq * 0.22, sy = 1 - sq * 0.26;
    const legLen = r * 0.62;
    const y = floor - h - r - legLen - bob;

    const body = stage === 2 ? colors.accent : stage === 1 ? colors.soft : colors.mid;
    // Eye whites stay readable on each body color: in dark mode the bright stage inverts them.
    const invert = stage === 2 && !colors.light;
    const eye = invert ? colors.base : colors.light ? colors.raised : colors.fg;
    const pupil = invert || colors.light ? colors.fg : colors.base;
    const mouth = stage === 0 ? colors.fg : colors.light ? colors.raised : colors.base;

    // a soft shadow keeps them on the ground, shrinking as they jump
    if (c.state !== 'hop') {
      ctx.fillStyle = colors.fg; ctx.globalAlpha = 0.14;
      ctx.beginPath(); ctx.ellipse(px, floor + 1, r * Math.max(0.4, 0.95 - h / (160 * s)), 2 * s, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.save(); ctx.translate(px, y);

    // legs
    if (c.state !== 'hop') {
      ctx.strokeStyle = stage === 0 ? colors.soft : body; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
      const swing = moving ? Math.sin(c.gait) * r * 0.42 : 0;
      const footY = r + legLen + bob;
      [[-r * 0.38, swing], [r * 0.38, -swing]].forEach(([lx, sw]) => {
        ctx.beginPath(); ctx.moveTo(lx, r * 0.8 * sy); ctx.lineTo(lx + sw, footY); ctx.stroke();
      });
    }

    if (moving) ctx.rotate(Math.sin(c.gait) * 0.08); // a little waddle
    ctx.scale(sx, sy);

    // body: scruffy when raw, tidy once transformed, bright once it's production data
    if (stage === 0) {
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * TAU;
        const rad = r * (1 + 0.1 * Math.sin(a * 4 + c.seed + time * 3) + 0.05 * Math.sin(a * 7 - time * 2));
        const qx = Math.cos(a) * rad, qy = Math.sin(a) * rad;
        if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
      }
      ctx.closePath();
      ctx.fillStyle = body; ctx.fill();
      // messy tuft
      ctx.strokeStyle = colors.soft; ctx.lineWidth = 1.6;
      [-0.35, 0.05, 0.42].forEach((o) => { ctx.beginPath(); ctx.moveTo(o * r, -r * 0.92); ctx.lineTo(o * r * 1.5, -r * 1.36 - Math.sin(time * 5 + c.seed + o) * 1.2); ctx.stroke(); });
    } else {
      rr(-r, -r, r * 2, r * 2, r * 0.56);
      ctx.fillStyle = body; ctx.fill();
    }
    if (stage === 2) { // tiny sparkle: it made it to the production layer
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 4 + c.seed);
      const gx = r * 1.15, gy = -r * 1.15, g = r * 0.3;
      ctx.beginPath(); ctx.moveTo(gx - g, gy); ctx.lineTo(gx + g, gy); ctx.moveTo(gx, gy - g); ctx.lineTo(gx, gy + g); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // eyes look at the pointer when it's close, otherwise where they're going
    let lx = 1, ly = 0;
    const dx = mx - px, dy = my - y, d = Math.hypot(dx, dy);
    if (d < 230) { lx = dx / (d || 1); ly = dy / (d || 1); }
    const eyeX = r * 0.38, eyeY = -r * 0.14, er = r * 0.29;
    [-eyeX, eyeX].forEach((ex) => {
      if (c.blink > 0) {
        ctx.strokeStyle = eye; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ex - er, eyeY); ctx.lineTo(ex + er, eyeY); ctx.stroke();
      } else {
        ctx.fillStyle = eye;
        dot(ex, eyeY, er);
        ctx.fillStyle = pupil;
        dot(ex + lx * er * 0.42, eyeY + ly * er * 0.42, er * 0.5);
      }
    });
    // mouth: a flat line when raw, a smile from then on
    ctx.strokeStyle = mouth; ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (stage === 0) { ctx.moveTo(-r * 0.2, r * 0.42); ctx.lineTo(r * 0.2, r * 0.42); }
    else ctx.arc(0, r * 0.22, r * 0.3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    ctx.save();
    if (rtl) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    drawBelt();
    drawBus();
    drawBits();
    chars.filter((c) => c.state !== 'hop').forEach(drawChar);
    station(0, X[0], () => drawIngest(X[0]));
    station(1, X[1], () => drawStore(X[1], busy[1]));
    station(2, X[2], () => drawTransform(X[2], busy[2]));
    station(3, X[3], () => drawWarehouse(X[3]));
    station(4, X[4], () => drawVisualize(X[4]));
    chars.filter((c) => c.state === 'hop').forEach(drawChar);
    pops.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.55);
      ctx.fillStyle = colors.accent;
      dot(p.x, p.y, 2);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `500 ${Math.max(10, 12.5 * s)}px ${colors.font}`;
    labels.forEach((label, i) => {
      ctx.fillStyle = busy[i] || pulse[i] > 0.15 ? colors.accent : colors.soft; // the label lights up while its station works
      ctx.fillText(label, rtl ? W - X[i] : X[i], floor + 28 * Math.max(s, 0.8));
    });
  };

  /* ── run ── */
  let raf = 0, last = 0, visible = true;
  const loop = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0) * (motionMode() === 'calm' ? 0.7 : 1);
    last = now;
    gearTurn += dt * (busy[2] ? 3.2 : 1.3);
    update(dt);
    draw();
    if (visible && !document.hidden && !still()) raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf && !still() && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
  };
  const pointerX = (clientX: number) => {
    const x = clientX - canvas.getBoundingClientRect().left;
    return rtl ? W - x : x;
  };

  const onMove = (e: PointerEvent) => { mx = pointerX(e.clientX); my = e.clientY - canvas.getBoundingClientRect().top; };
  const onLeave = () => { mx = my = -9999; };
  const onClick = (e: MouseEvent) => {
    const x = pointerX(e.clientX);
    chars.forEach((c) => { if (c.state === 'walk' && c.h === 0 && Math.abs(c.x - x) < 160) c.v = (230 + Math.random() * 90) * s; });
    spawn();
  };
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);
  const redrawIfStill = () => { if (still()) draw(); };
  const resize = new ResizeObserver(() => { size(); redrawIfStill(); });
  resize.observe(canvas);
  const onScreen = new IntersectionObserver((e) => { visible = e[0].isIntersecting; kick(); });
  onScreen.observe(hero);
  document.addEventListener('visibilitychange', kick);
  const themeWatch = new MutationObserver(() => { readColors(); redrawIfStill(); kick(); });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang', 'data-motion'] });

  readColors();
  size();
  seedWalkers();
  if (still()) draw(); else kick();

  return {
    setLabels: (next) => { labels = next; redrawIfStill(); },
    setRtl: (next) => { rtl = next; redrawIfStill(); },
    destroy: () => {
      cancelAnimationFrame(raf);
      resize.disconnect(); onScreen.disconnect(); themeWatch.disconnect();
      document.removeEventListener('visibilitychange', kick);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
    },
  };
}
