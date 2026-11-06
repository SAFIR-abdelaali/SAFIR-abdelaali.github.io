import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { gsap, useScene } from '../lib/motion';
import { startPipeline, type Pipeline } from '../lib/pipeline';
import { Chevron, Magnetic, Words, delay } from './primitives';

function ResumeMenu() {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('a')?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      className="cv-pick"
      ref={root}
      onBlur={(e) => {
        if (e.relatedTarget && !root.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button ref={button} className="btn btn-glass cv-toggle" type="button" aria-expanded={open} aria-controls="cv-menu" onClick={() => setOpen(!open)}>
        {t.hero.resume}
        <Chevron />
      </button>
      <div className={`cv-menu ${open ? 'open' : ''}`} id="cv-menu" ref={menu} onClick={() => setOpen(false)}>
        <a href="/assets/cv-en.pdf" target="_blank" rel="noopener" hrefLang="en" lang="en">
          English
        </a>
        <a href="/assets/cv-fr.pdf" target="_blank" rel="noopener" hrefLang="fr" lang="fr">
          Français
        </a>
      </div>
    </div>
  );
}

export function Hero() {
  const { t, lang } = useI18n();
  const hero = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pipeline = useRef<Pipeline | null>(null);

  useEffect(() => {
    const instance = startPipeline(hero.current!, canvas.current!, { labels: t.hero.stages, rtl: lang === 'ar' });
    pipeline.current = instance;
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    pipeline.current?.setLabels(t.hero.stages);
    pipeline.current?.setRtl(lang === 'ar');
  }, [lang, t]);

  // The copy drifts up and fades as you leave, leaving the pipeline on stage a moment longer.
  useScene(
    hero,
    (el) => {
      gsap.to(el.querySelector('.hero-copy'), {
        y: -70,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: 0.6 },
      });
    },
    [],
  );

  return (
    <section className="hero" id="hero" aria-label={t.hero.label} ref={hero}>
      <canvas className="hero-canvas" ref={canvas} role="img" aria-label={t.hero.canvas} />
      <div className="hero-copy">
        <p className="text-[clamp(0.9375rem,1.6vw,1.125rem)] font-medium text-soft" data-reveal="rise" style={delay(0.15)}>
          {t.hero.role}
        </p>
        <Words as="h1" className="hero-name" text={t.hero.name} d={0.25} />
        <p className="text-[clamp(1.0625rem,2vw,1.375rem)]" data-reveal="rise" style={delay(0.6)}>
          {t.hero.sub}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3" data-reveal="rise" style={delay(0.75)}>
          <Magnetic>
            <a className="btn btn-primary" href="#projects">
              {t.hero.viewProjects}
            </a>
          </Magnetic>
          <Magnetic>
            <ResumeMenu />
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
