import { useI18n } from '../i18n';

const VB = '0 0 240 150';

/** A dot that keeps travelling a path. `at` offsets it along the loop, in seconds. */
const Packet = ({ d, at = 0, dur = 3, r = 3 }: { d: string; at?: number; dur?: number; r?: number }) => (
  <circle className="v-packet" r={r} style={{ offsetPath: `path('${d}')`, animationDuration: `${dur}s`, animationDelay: `${-at}s` }} />
);

const CDC_FLOWS = [
  { d: 'M68 58 C 92 58, 96 75, 122 75', tone: 'v-bright' },
  { d: 'M68 75 H 122', tone: 'v-soft' },
  { d: 'M68 92 C 92 92, 96 75, 122 75', tone: 'v-bright' },
];
const JOB_FLOWS = ['M46 32 C 90 32, 90 75, 128 75', 'M46 75 H 128', 'M46 118 C 90 118, 90 75, 128 75'];

/** SIR curves, integrated from the actual model. */
const SIR_PATHS = (() => {
  const beta = 0.5, gamma = 0.15, dt = 0.25, T = 75;
  const W = 240, H = 150, top = 12, bottom = 12;
  let S = 0.99, I = 0.01, R = 0;
  const lines = { s: '', i: '', r: '' };
  const y = (v: number) => (H - bottom - v * (H - top - bottom)).toFixed(1);
  for (let t = 0; t <= T; t += dt) {
    const x = (10 + (t / T) * (W - 20)).toFixed(1);
    const cmd = t === 0 ? 'M' : 'L';
    lines.s += `${cmd}${x} ${y(S)}`;
    lines.i += `${cmd}${x} ${y(I)}`;
    lines.r += `${cmd}${x} ${y(R)}`;
    const dS = -beta * S * I, dI = beta * S * I - gamma * I;
    S += dS * dt; I += dI * dt; R += gamma * I * dt;
  }
  return lines;
})();

export function CdcViz() {
  const { t } = useI18n();
  const p = t.projects.cdc;
  return (
    <svg viewBox={VB} role="img" aria-label={p.viz}>
      <ellipse className="v-panel" cx="38" cy="42" rx="24" ry="9" />
      <path className="v-panel" d="M14 42v62c0 5 11 9 24 9s24-4 24-9V42" />
      <path className="v-stroke" d="M14 63c0 5 11 9 24 9s24-4 24-9M14 84c0 5 11 9 24 9s24-4 24-9" />
      {CDC_FLOWS.map(({ d, tone }) => (
        <path key={d} className={`${tone} flow`} d={d} />
      ))}
      {CDC_FLOWS.map(({ d }, i) => (
        <Packet key={d} d={d} at={i} />
      ))}
      <g className="v-float">
        <path className="v-fill-accent" d="M136 28h78a14 14 0 0 1 14 14v52a14 14 0 0 1-14 14h-52l-18 16v-16h-8a14 14 0 0 1-14-14V42a14 14 0 0 1 14-14z" />
        <text className="v-fill-on-accent" x="175" y="68" fontSize="27" fontWeight="600" textAnchor="middle" letterSpacing="-1" direction="ltr">
          −35%
        </text>
        <text className="v-fill-on-accent v-label" x="175" y="88">
          {p.caption}
        </text>
      </g>
    </svg>
  );
}

export function SirViz() {
  const { t } = useI18n();
  return (
    <svg className="sir" viewBox={VB} role="img" aria-label={t.projects.sir.viz}>
      {(['s', 'r', 'i'] as const).map((k) => (
        <path key={k} className={k} pathLength={1} d={SIR_PATHS[k]} />
      ))}
      {(['s', 'r', 'i'] as const).map((k) => (
        <Packet key={k} d={SIR_PATHS[k]} dur={7} r={3.5} />
      ))}
    </svg>
  );
}

export function JobViz() {
  const { t } = useI18n();
  return (
    <svg viewBox={VB} role="img" aria-label={t.projects.job.viz}>
      {JOB_FLOWS.map((d) => (
        <path key={d} className="v-soft flow" d={d} />
      ))}
      {JOB_FLOWS.map((d, i) => (
        <Packet key={d} d={d} at={i} />
      ))}
      <g className="v-fill-soft">
        <g className="v-float">
          <circle cx="30" cy="26" r="7" />
          <path d="M16 46a14 12 0 0 1 28 0z" />
        </g>
        <g className="v-float" style={{ animationDelay: '-1.3s' }}>
          <circle cx="30" cy="69" r="7" />
          <path d="M16 89a14 12 0 0 1 28 0z" />
        </g>
        <g className="v-float" style={{ animationDelay: '-2.6s' }}>
          <circle cx="30" cy="112" r="7" />
          <path d="M16 132a14 12 0 0 1 28 0z" />
        </g>
      </g>
      <rect className="v-panel" x="128" y="39" width="96" height="72" rx="14" />
      <circle className="v-ping" cx="176" cy="72" r="24" />
      <circle className="v-fill-accent" cx="176" cy="66" r="11" />
      <path className="v-fill-accent" d="M154 101a22 19 0 0 1 44 0z" />
    </svg>
  );
}

export function StockViz() {
  const { t } = useI18n();
  const [production, cleaned, raw] = t.projects.stock.layers;
  return (
    <svg viewBox={VB} role="img" aria-label={t.projects.stock.viz}>
      <rect className="v-fill-mid" x="14" y="94" width="84" height="26" rx="8" />
      <rect className="v-fill-soft" x="14" y="62" width="84" height="26" rx="8" />
      <rect className="v-fill-accent" x="14" y="30" width="84" height="26" rx="8" />
      <text className="v-fill-on-accent v-label" x="56" y="47">{production}</text>
      <text className="v-fill-on-accent v-label" x="56" y="79">{cleaned}</text>
      <text className="v-fill-fg v-label" x="56" y="111">{raw}</text>
      <path className="v-soft flow" d="M104 75 H 136" />
      <Packet d="M104 75 H 136" dur={1.6} />
      <rect className="v-panel" x="140" y="30" width="86" height="90" rx="12" />
      <rect className="v-fill-mid v-bar" x="153" y="84" width="11" height="24" rx="3" />
      <rect className="v-fill-soft v-bar" style={{ animationDelay: '-1.1s' }} x="170" y="66" width="11" height="42" rx="3" />
      <rect className="v-fill-soft v-bar" style={{ animationDelay: '-2.3s' }} x="187" y="74" width="11" height="34" rx="3" />
      <rect className="v-fill-accent v-bar" style={{ animationDelay: '-3.2s' }} x="204" y="46" width="11" height="62" rx="3" />
    </svg>
  );
}

export function FraudViz() {
  const { t } = useI18n();
  const p = t.projects.fraud;
  return (
    <svg viewBox={VB} role="img" aria-label={p.viz}>
      <circle className="ring-track" cx="66" cy="62" r="40" />
      <circle className="ring" style={{ '--v': 92 } as React.CSSProperties} pathLength={100} cx="66" cy="62" r="40" transform="rotate(-90 66 62)" />
      <g className="v-orbit" style={{ transformOrigin: '66px 62px' }}>
        <circle className="v-fill-accent" cx="66" cy="16" r="2.5" />
      </g>
      <text className="v-text" x="66" y="69" direction="ltr">92%</text>
      <text className="v-cap" x="66" y="130">{p.precision}</text>
      <circle className="ring-track" cx="174" cy="62" r="40" />
      <circle className="ring ring-b" style={{ '--v': 77 } as React.CSSProperties} pathLength={100} cx="174" cy="62" r="40" transform="rotate(-90 174 62)" />
      <g className="v-orbit" style={{ transformOrigin: '174px 62px', animationDelay: '-4s' }}>
        <circle className="v-fill-soft" cx="174" cy="16" r="2.5" />
      </g>
      <text className="v-text" x="174" y="69" direction="ltr">77%</text>
      <text className="v-cap" x="174" y="130">{p.recall}</text>
    </svg>
  );
}

export function ToolViz() {
  const { t } = useI18n();
  return (
    <svg viewBox={VB} role="img" aria-label={t.projects.tool.viz}>
      <path className="v-soft flow" d="M120 75 L44 32" />
      <path className="v-soft flow" d="M120 75 L196 32" />
      <path className="v-soft flow" d="M120 75 L44 118" />
      <path className="v-soft flow" d="M120 75 L196 118" />
      <Packet d="M44 32 L120 75" />
      <Packet d="M120 75 L196 32" at={0.8} />
      <Packet d="M44 118 L120 75" at={1.6} />
      <Packet d="M120 75 L196 118" at={2.4} />
      <circle className="v-fill-soft v-node" cx="44" cy="32" r="12" />
      <circle className="v-fill-soft v-node" style={{ animationDelay: '-1s' }} cx="196" cy="32" r="12" />
      <circle className="v-fill-soft v-node" style={{ animationDelay: '-2s' }} cx="44" cy="118" r="12" />
      <circle className="v-fill-soft v-node" style={{ animationDelay: '-3s' }} cx="196" cy="118" r="12" />
      <circle className="v-fill-accent" cx="120" cy="75" r="30" />
      <path className="v-fill-on-accent v-wiggle" d="M131 62a9 9 0 0 0-11 11l-11 11a3.500 3.500 0 0 0 5 5l11-11a9 9 0 0 0 11-11l-6 6-5-1-1-5z" />
    </svg>
  );
}
