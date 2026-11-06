import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { LANGS, pathFor, useI18n, type Lang } from '../i18n';
import { isPlainClick, onFontsChange, runViewTransition, togglePause, useMotionMode } from '../lib/motion';
import { savePref } from '../lib/prefs';

const SECTIONS = ['projects', 'skills', 'about', 'experience', 'contact'] as const;
const LANG_LABEL: Record<Lang, string> = { en: 'EN', fr: 'FR', ar: 'ع' };
const LANG_NAME: Record<Lang, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

function setTheme(next: 'light' | 'dark') {
  const html = document.documentElement;
  html.dataset.theme = next;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', getComputedStyle(html).getPropertyValue('--c-base').trim());
  savePref('theme', next);
}

export function Nav() {
  const { t, lang, switchTo } = useI18n();
  const list = useRef<HTMLUListElement>(null);
  const pill = useRef<HTMLLIElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const mode = useMotionMode();

  const placePill = useCallback(() => {
    const el = pill.current;
    const link = list.current?.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
    if (!el) return;
    if (!link) {
      el.style.opacity = '0';
      return;
    }
    el.style.opacity = '1';
    el.style.width = `${link.offsetWidth}px`;
    el.style.transform = `translateX(${link.parentElement!.offsetLeft}px)`;
  }, []);

  // The pill follows the section under the middle of the viewport.
  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    document.querySelectorAll('main > section').forEach((s) => spy.observe(s));
    addEventListener('resize', placePill);
    const stopFonts = onFontsChange(placePill);
    return () => {
      spy.disconnect();
      removeEventListener('resize', placePill);
      stopFonts();
    };
  }, [placePill]);

  useEffect(placePill, [current, lang, placePill]);

  const onToggleTheme = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    runViewTransition('theme', () => setTheme(next), { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <>
      <nav className="site-nav glass" aria-label={t.nav.label}>
        <ul className="nav-links" ref={list}>
          <li className="nav-pill" ref={pill} aria-hidden="true" />
          {SECTIONS.map((id) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={current === id ? 'true' : 'false'}>
                {t.nav[id]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="controls glass" role="group" aria-label={t.controls.label}>
        <ul className="flex gap-0.5" aria-label={t.controls.language}>
          {LANGS.map((code) => (
            <li key={code}>
              <a
                className="lang-link"
                href={pathFor(code)}
                hrefLang={code}
                lang={code}
                aria-label={LANG_NAME[code]}
                aria-current={code === lang ? 'true' : 'false'}
                onClick={(e) => {
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  switchTo(code);
                }}
              >
                {LANG_LABEL[code]}
              </a>
            </li>
          ))}
        </ul>
        <span className="controls-sep" aria-hidden="true" />
        <button className="theme-btn motion-btn" type="button" aria-label={t.controls.motion} aria-pressed={mode === 'still'} onClick={togglePause}>
          <svg className="motion-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6.5" y="5" width="3.8" height="14" rx="1.2" />
            <rect x="13.7" y="5" width="3.8" height="14" rx="1.2" />
          </svg>
          <svg className="motion-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.3c0-.9 1-1.5 1.800-1l9 6.700c.7.5.7 1.500 0 2l-9 6.700c-.8.5-1.800-.1-1.800-1z" />
          </svg>
        </button>
        <button className="theme-btn" type="button" aria-label={t.controls.theme} onClick={onToggleTheme}>
          <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M5.300 18.700l1.500-1.500M17.200 6.800l1.500-1.500" />
          </svg>
          <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.500 14.200A8.500 8.500 0 0 1 9.800 3.500a8.500 8.500 0 1 0 10.700 10.700z" />
          </svg>
        </button>
      </div>
    </>
  );
}
