import { useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { EASE_SOFT as EASE, reducedMotion, refreshScroll } from '../lib/motion';
import { Chevron } from './primitives';

/**
 * Hides each `.extra` inside it until the button is pressed. `shown` is toggled on the
 * DOM so a closing body can stay visible while its height animates shut.
 */
export function ShowMore({ className, children }: { className?: string; children: ReactNode }) {
  const { t } = useI18n();
  const body = useRef<HTMLDivElement>(null);
  const height = useRef<Animation | null>(null);
  const fades = useRef<Animation[]>([]);
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const el = body.current!;
    const extras = [...el.querySelectorAll<HTMLElement>('.extra')];
    fades.current.forEach((a) => a.cancel());
    fades.current = [];
    const opening = !open;
    setOpen(opening);

    const from = el.getBoundingClientRect().height;
    height.current?.cancel();
    extras.forEach((x) => x.classList.toggle('shown', opening));
    if (reducedMotion()) {
      refreshScroll();
      return;
    }

    const to = el.getBoundingClientRect().height;
    if (!opening) extras.forEach((x) => x.classList.add('shown')); // stay visible while the height closes
    el.style.overflow = 'hidden';
    const anim = el.animate({ height: [`${from}px`, `${to}px`] }, { duration: 550, easing: EASE });
    height.current = anim;
    anim.onfinish = () => {
      el.style.overflow = '';
      if (!opening) extras.forEach((x) => x.classList.remove('shown'));
      fades.current.forEach((a) => a.cancel());
      fades.current = [];
      refreshScroll();
    };
    anim.oncancel = () => {
      el.style.overflow = '';
    };

    let cards = 0;
    extras.forEach((x) => {
      // cards stagger; small logos arrive together
      const wait = x.classList.contains('tech') ? 60 : cards++ * 60;
      if (opening) x.animate({ opacity: [0, 1], transform: ['translateY(14px)', 'none'] }, { duration: 500, delay: wait, easing: EASE, fill: 'backwards' });
      else fades.current.push(x.animate({ opacity: [1, 0] }, { duration: 220, easing: EASE, fill: 'forwards' }));
    });
  };

  return (
    <>
      <div className={className} ref={body}>
        {children}
      </div>
      <div className="more-row" data-reveal="rise">
        <button className="btn btn-glass" type="button" aria-expanded={open} onClick={toggle}>
          {open ? t.more.hide : t.more.show}
          <Chevron />
        </button>
      </div>
    </>
  );
}
