import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { runViewTransition, scrollToY } from '../lib/motion';
import { savePref } from '../lib/prefs';
import { ar } from './ar';
import { en, type Messages } from './en';
import { fr } from './fr';

export const LANGS = ['en', 'fr', 'ar'] as const;
export type Lang = (typeof LANGS)[number];
export const messages: Record<Lang, Messages> = { en, fr, ar };

export const pathFor = (lang: Lang) => (lang === 'en' ? '/' : `/${lang}/`);
export const dirFor = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');
export const langFromPath = (path: string): Lang => {
  const first = path.split('/')[1];
  return first === 'fr' || first === 'ar' ? first : 'en';
};

type I18n = { lang: Lang; t: Messages; switchTo: (lang: Lang) => void };
const Context = createContext<I18n | null>(null);

const applyToDocument = (lang: Lang) => {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = dirFor(lang);
  document.title = messages[lang].meta.title;
  document.querySelector('meta[name=description]')?.setAttribute('content', messages[lang].meta.description);
};

/** The section under the middle of the viewport, used to keep the reader in place across a language swap. */
const readingAnchor = () => {
  const mid = innerHeight / 2;
  const section = [...document.querySelectorAll<HTMLElement>('main > section')].find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= mid && r.bottom >= mid;
  });
  return section ? { section, top: section.getBoundingClientRect().top } : null;
};

export function I18nProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLang] = useState(initial);

  const apply = useCallback((next: Lang) => {
    const anchor = readingAnchor();
    runViewTransition('lang', () => {
      flushSync(() => setLang(next));
      applyToDocument(next);
      if (anchor) scrollToY(scrollY + anchor.section.getBoundingClientRect().top - anchor.top);
    });
  }, []);

  const switchTo = useCallback(
    (next: Lang) => {
      savePref('lang', next);
      if (next === lang) return;
      history.pushState(null, '', pathFor(next) + location.hash);
      apply(next);
    },
    [apply, lang],
  );

  useEffect(() => {
    applyToDocument(lang); // dev server serves one HTML file for every path
    // Most history steps are hash-only; leave those to the browser's own scroll restoration.
    const onPop = () => {
      const next = langFromPath(location.pathname);
      if (next !== document.documentElement.lang) apply(next);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [apply]);

  const value = useMemo(() => ({ lang, t: messages[lang], switchTo }), [lang, switchTo]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error('useI18n needs I18nProvider');
  return value;
}
