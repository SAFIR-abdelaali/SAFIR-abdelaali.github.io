import { SKILL_GROUPS } from '../data/skills';
import { Logo } from './primitives';

const LOGOS = SKILL_GROUPS.flatMap((group) => group.items).filter((tech) => tech.icon);

/** A slow band of the tools from Skills. Decorative: the same names are listed in the section above. */
export function Marquee() {
  const row = LOGOS.map((tech) => (
    <span className="marquee-item" key={tech.name}>
      <Logo icon={tech.icon!} />
      {tech.name}
    </span>
  ));
  return (
    <div className="marquee" dir="ltr" aria-hidden="true">
      <div className="marquee-track">
        <div className="marquee-row">{row}</div>
        <div className="marquee-row">{row}</div>
      </div>
    </div>
  );
}
