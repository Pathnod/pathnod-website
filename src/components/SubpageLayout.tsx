import type { ReactNode } from 'react';
import { InterestForm } from './InterestForm';

interface Detail {
  title: string;
  body: string;
}

interface Props {
  audience: 'beta' | 'operator';
  eyebrow: string;
  title: ReactNode;
  introduction: string;
  aside: ReactNode;
  formEyebrow: string;
  formIntroTitle: ReactNode;
  formIntro: string;
  footnote: string;
  panelTitle: string;
  panelIntro: string;
  secondaryTitle: string;
  details: [Detail, Detail, Detail];
}

export function SubpageLayout(props: Props) {
  return (
    <main id="main">
      <section className="shell subpage-hero">
        <div data-scroll-reveal><p className="eyebrow"><span className="eyebrow-line" /> {props.eyebrow}</p><h1>{props.title}</h1><p>{props.introduction}</p></div>
        <aside data-scroll-reveal>{props.aside}</aside>
      </section>
      <section className="shell form-layout">
        <div className="form-intro" data-scroll-reveal><span className="form-eyebrow">{props.formEyebrow}</span><h2>{props.formIntroTitle}</h2><p>{props.formIntro}</p><p className="footnote">{props.footnote}</p></div>
        <div className="form-panel" data-scroll-reveal><h2>{props.panelTitle}</h2><p>{props.panelIntro}</p><InterestForm audience={props.audience} /></div>
      </section>
      <section className="shell subpage-secondary"><span className="form-eyebrow">{props.secondaryTitle}</span><div className="mini-list">
        {props.details.map(({ title, body }, index) => <article key={title} data-scroll-reveal><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}
      </div></section>
    </main>
  );
}
