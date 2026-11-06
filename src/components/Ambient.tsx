import { useEffect, useRef } from 'react';
import { startAmbient } from '../lib/ambient';

/** Fixed behind the page: slow colored light (CSS) and drifting motes (canvas). */
export function Ambient() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flare = useRef<HTMLDivElement>(null);
  useEffect(() => startAmbient(canvas.current!, flare.current!), []);
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="aura aura-a" />
        <span className="aura aura-b" />
        <span className="aura aura-c" />
        <canvas ref={canvas} />
      </div>
      <div className="flare" ref={flare} aria-hidden="true" />
    </>
  );
}
