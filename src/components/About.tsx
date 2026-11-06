import { useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap, useScene } from '../lib/motion';
import { Chips, Icon, Words, delay, eachWord } from './primitives';

export function About() {
  const { t, lang } = useI18n();
  const a = t.about;
  const root = useRef<HTMLElement>(null);

  useScene(
    root,
    (el) => {
      // The portrait drifts slowly inside its frame.
      gsap.fromTo(
        el.querySelector('.portrait img'),
        { yPercent: -5 },
        { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: 0.8 } },
      );
      // The story lights up word by word, paced by the reader's scroll.
      gsap.utils.toArray<HTMLElement>('.bio p', el).forEach((p) => {
        gsap.fromTo(
          p.querySelectorAll('.scrub'),
          { opacity: 0.2 },
          { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 62%', scrub: 0.5 } },
        );
      });
    },
    [lang],
  );

  return (
    <section id="about" className="sec" ref={root}>
      <Words as="h2" className="sec-title" text={a.title} />
      <div className="about">
        <figure className="card portrait" data-reveal="clip">
          <div className="portrait-wipe">
            <img src="/assets/portrait.webp" alt={a.portrait} loading="lazy" width={698} height={845} />
          </div>
        </figure>
        <div className="facts">
          <div className="card fact" data-reveal="rise" style={delay(0.06)}>
            <Icon>
              <path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z" />
              <circle cx="12" cy="9.500" r="2.500" />
            </Icon>
            <div>
              <p className="fact-k">{a.location}</p>
              <p className="fact-v">{a.locationValue}</p>
            </div>
          </div>
          <div className="card fact" data-reveal="rise" style={delay(0.12)}>
            <Icon>
              <path d="M2 9l10-5 10 5-10 5zM6 11.500V17c0 1.400 2.700 3 6 3s6-1.600 6-3v-5.500" />
            </Icon>
            <div>
              <p className="fact-k">{a.education}</p>
              <p className="fact-v">{a.educationValue}</p>
            </div>
          </div>
        </div>
        <div className="card tile" data-reveal="rise">
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.500 2.500 3.800 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3z" />
          </Icon>
          <h3 className="card-title">{a.languages}</h3>
          <Chips items={a.languageItems} />
        </div>
        <div className="card tile" data-reveal="rise" style={delay(0.08)}>
          <Icon>
            <circle cx="12" cy="9" r="6" />
            <path d="M8.500 14l-1.500 7 5-2.500 5 2.500-1.500-7" />
          </Icon>
          <h3 className="card-title">{a.certification}</h3>
          <Chips items={a.certificationItems} />
        </div>
      </div>
      <div className="bio">
        {a.bio.map((paragraph) => (
          <p key={paragraph}>{eachWord(paragraph, (word) => <span className="scrub">{word}</span>)}</p>
        ))}
      </div>
    </section>
  );
}
