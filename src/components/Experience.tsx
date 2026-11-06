import { useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap, ScrollTrigger, useScene } from '../lib/motion';
import { Arrow, Chips, Icon, Words, delay } from './primitives';

const TILE_ICONS = [
  ['M3 7h13l-3-3M21 17H8l3 3', 'M12 8V4M9 13h.01M15 13h.01M9.500 16.500h5M7 8h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z', 'M21 12a8 8 0 0 1-11.800 7L4 20.500 5.500 16A8 8 0 1 1 21 12z'],
  ['M4 20V4M4 20h16M8 15l4-4 3 3 5-6', 'M3 5h18l-7 8v6l-4 2v-8z', 'M12 3l9 5v8l-9 5-9-5V8zM3.500 8.300 12 13l8.500-4.700M12 13v8'],
];

/** Same order as t.experience.jobs. `logo` is a real mark in public/assets. */
const COMPANIES: { name: string; url: string; logo: string }[] = [
  { name: 'Pluriel', url: 'https://www.pluriel.net/', logo: '/assets/logo-pluriel.png' },
  { name: 'Havet Digital Group (iaweb.dev)', url: 'https://iaweb.dev/', logo: '/assets/logo-iaweb.png' },
];

export function Experience() {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);

  // One line connects the roles: it fills with scroll and lights each dot as its head passes.
  useScene(
    root,
    (el) => {
      const list = el.querySelector('.timeline')!;
      gsap.fromTo(
        el.querySelector('.tl-fill'),
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } },
      );
      gsap.utils.toArray<HTMLElement>('.tl-dot', el).forEach((dot) => {
        ScrollTrigger.create({ trigger: dot, start: 'top 62%', toggleClass: 'is-reached' });
      });
    },
    [lang],
  );

  return (
    <section id="experience" className="sec" ref={root}>
      <Words as="h2" className="sec-title" text={t.experience.title} />
      <ol className="timeline">
        <li className="tl-line" aria-hidden="true" />
        <li className="tl-fill" aria-hidden="true" />
        {t.experience.jobs.map((job, j) => (
          <li className="tl-step" key={j}>
            <span className="tl-dot" aria-hidden="true" />
            <div className="exp-head" data-reveal="rise">
              {/* The name beside it is the accessible link; this is the same target for the pointer. */}
              <a className="company-logo" href={COMPANIES[j].url} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true">
                <img src={COMPANIES[j].logo} alt="" width={44} height={44} loading="lazy" />
              </a>
              <div>
                <h3 className="exp-role">{job.role}</h3>
                <p className="exp-meta">
                  <a className="company-link" href={COMPANIES[j].url} target="_blank" rel="noopener" dir="ltr">
                    {COMPANIES[j].name}
                    <Arrow />
                  </a>
                  {' · '}
                  {job.date}
                </p>
              </div>
            </div>
            <div className="grid3">
              {job.tiles.map((tile, i) => (
                <div className="card tile" key={i} data-reveal="rise" style={delay(i * 0.08)}>
                  <Icon>
                    <path d={TILE_ICONS[j][i]} />
                  </Icon>
                  <h4 className="card-title">{tile.title}</h4>
                  <Chips items={tile.chips} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
