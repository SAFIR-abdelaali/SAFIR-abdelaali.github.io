import type { CSSProperties } from 'react';
import { METHODS_ICON, SKILL_GROUPS, type Tech } from '../data/skills';
import { useI18n } from '../i18n';
import { Chips, Icon, Logo, Words, delay } from './primitives';
import { ShowMore } from './ShowMore';

function TechItem({ tech, index, extra }: { tech: Tech; index: number; extra: boolean }) {
  return (
    <li className={`tech ${extra ? 'extra' : ''}`} dir="ltr" style={{ '--brand': tech.brand, '--i': index } as CSSProperties}>
      <span className="tech-tile">
        {tech.icon ? (
          <Logo icon={tech.icon} />
        ) : (
          <span className="logo logo-mono" aria-hidden="true">
            {tech.mono}
          </span>
        )}
      </span>
      <span className="tech-name">{tech.name}</span>
    </li>
  );
}

export function Skills() {
  const { t } = useI18n();
  return (
    <section id="skills" className="sec">
      <Words as="h2" className="sec-title" text={t.skills.title} />
      <ShowMore className="grid3">
        {SKILL_GROUPS.map((group, g) => {
          const lead = g < 3;
          return (
            <div key={group.key} className={`card tile ${lead ? '' : 'extra'}`} {...(lead ? { 'data-reveal': 'rise', style: delay(g * 0.08) } : {})}>
              <Icon>
                <path d={group.path} />
              </Icon>
              <h3 className="card-title">{t.skills[group.key]}</h3>
              <ul className="techs">
                {group.items.map((tech, i) => (
                  <TechItem key={tech.name} tech={tech} index={i} extra={lead && i >= 3} />
                ))}
              </ul>
            </div>
          );
        })}
        <div className="card tile extra">
          <Icon>
            <path d={METHODS_ICON} />
          </Icon>
          <h3 className="card-title">{t.skills.methods}</h3>
          <Chips items={t.skills.methodItems} />
        </div>
      </ShowMore>
    </section>
  );
}
