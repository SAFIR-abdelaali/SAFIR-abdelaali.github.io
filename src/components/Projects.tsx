import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { gsap, useScene } from '../lib/motion';
import { CdcViz, FraudViz, JobViz, SirViz, StockViz, ToolViz } from './ProjectViz';
import { Arrow, Chips, GITHUB as GH, Words } from './primitives';
import { ShowMore } from './ShowMore';

const External = () => (
  <span className="card-arrow" aria-hidden="true">
    <Arrow className="rtl:-scale-x-100" />
  </span>
);
const Down = () => (
  <span className="card-arrow" aria-hidden="true">
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v8M2.5 6.5 6 10l3.500-3.500" />
    </svg>
  </span>
);

type Lead = { href: string; title: string; line: string; viz: ReactNode; stack?: string[] };

function GridCard({ href, title, line, viz }: { href: string; title: string; line: string; viz: ReactNode }) {
  return (
    <a className="card extra" href={href} target="_blank" rel="noopener">
      <div className="viz">{viz}</div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-line">{line}</p>
      </div>
      <External />
    </a>
  );
}

export function Projects() {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);
  const p = t.projects;

  // Strongest first, as the owner chose. CDC links to Experience: that internship has no public repo.
  const leads: Lead[] = [
    { href: '#experience', title: p.cdc.title, line: p.cdc.line, viz: <CdcViz />, stack: ['Debezium', 'Kafka', 'Gemma 4', 'LangChain', 'Next.js'] },
    { href: `${GH}/SIR-Rumor-Detection`, title: p.sir.title, line: p.sir.line, viz: <SirViz />, stack: ['BERT', 'PyTorch', 'Hugging Face', 'Streamlit'] },
    { href: `${GH}/Job-recruitement-web-app`, title: p.job.title, line: p.job.line, viz: <JobViz /> },
  ];

  // As the next card arrives, the pinned one sinks back and dims.
  useScene(
    root,
    (el) => {
      const items = gsap.utils.toArray<HTMLElement>('.stack-item', el);
      items.slice(0, -1).forEach((item, i) => {
        if (getComputedStyle(item).position !== 'sticky') return;
        const pinnedAt = parseFloat(getComputedStyle(items[i + 1]).top);
        gsap.to(item, {
          scale: 0.93,
          '--dim': 0.55,
          ease: 'none',
          scrollTrigger: { trigger: items[i + 1], start: 'top 85%', end: `top ${pinnedAt}px`, scrub: 0.5 },
        });
      });
    },
    [lang],
  );

  return (
    <section id="projects" className="sec" ref={root}>
      <Words as="h2" className="sec-title" text={p.title} />
      <div className="stack">
        {leads.map((lead, i) => {
          const external = !lead.href.startsWith('#');
          return (
            <div className="stack-item" key={lead.href} style={{ '--n': i } as CSSProperties}>
              <a className="card stack-card" data-reveal="rise" href={lead.href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
                <span className="beam" aria-hidden="true" />
                <div className="viz">{lead.viz}</div>
                <div className="card-body">
                  <h3 className="card-title">{lead.title}</h3>
                  <p className="card-line">{lead.line}</p>
                  {lead.stack && <Chips items={lead.stack} />}
                </div>
                {external ? <External /> : <Down />}
              </a>
            </div>
          );
        })}
      </div>
      <ShowMore className="grid3">
        <GridCard href={`${GH}/E2E-Micro-Batches-Stock-Market-Data-Pipeline`} title={p.stock.title} line={p.stock.line} viz={<StockViz />} />
        <GridCard href={`${GH}/Fraud-Detection`} title={p.fraud.title} line={p.fraud.line} viz={<FraudViz />} />
        <GridCard href={`${GH}/ToolRent`} title={p.tool.title} line={p.tool.line} viz={<ToolViz />} />
      </ShowMore>
    </section>
  );
}
