import { About } from './components/About';
import { Ambient } from './components/Ambient';
import { Contact } from './components/Contact';
import { Experience } from './components/Experience';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Nav } from './components/Nav';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { I18nProvider, useI18n, type Lang } from './i18n';
import { refreshScroll, useMotionSystem, useReveals } from './lib/motion';
import { useEffect } from 'react';

function Page() {
  const { t, lang } = useI18n();
  useMotionSystem();
  useReveals([lang]);
  // Text length changes with the language, so every scroll position does too.
  useEffect(() => refreshScroll(), [lang]);

  return (
    <>
      <a className="skip" href="#projects">
        {t.skip}
      </a>
      <Ambient />
      <div className="scroll-bar" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Skills />
        <Marquee />
        <About />
        <Experience />
        <Contact />
      </main>
      <footer className="site-footer">{t.footer}</footer>
    </>
  );
}

export function App({ lang }: { lang: Lang }) {
  return (
    <I18nProvider initial={lang}>
      <Page />
    </I18nProvider>
  );
}
