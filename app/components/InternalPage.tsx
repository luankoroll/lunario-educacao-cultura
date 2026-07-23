import type { ReactNode } from "react";
import { ActionLink } from "./ActionLink";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  backHref?: string;
  backLabel?: string;
};

export function PageIntro({
  eyebrow = "Lunário",
  title,
  intro,
  backHref = "/",
  backLabel = "Voltar ao início",
}: PageIntroProps) {
  return (
    <header className="internal-hero">
      <div className="page-shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="internal-hero__intro">{intro}</p>
        <ActionLink href={backHref} variant="text">
          {backLabel}
        </ActionLink>
      </div>
    </header>
  );
}

type InfoCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string[];
  href: string;
  label: string;
  children?: ReactNode;
};

export function InfoCard({
  eyebrow,
  title,
  description,
  meta = [],
  href,
  label,
  children,
}: InfoCardProps) {
  return (
    <article className="content-card">
      {children}
      {eyebrow ? <p className="content-card__eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {meta.length ? (
        <ul className="meta-list" aria-label="Informações">
          {meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <ActionLink href={href} variant="text">
        {label}
      </ActionLink>
    </article>
  );
}

type ContentSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  intro: string;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
  tone?: "white" | "soft" | "ink";
};

export function ContentSection({
  id,
  eyebrow,
  title,
  intro,
  actionHref,
  actionLabel,
  children,
  tone = "white",
}: ContentSectionProps) {
  return (
    <section className={`home-section home-section--${tone}`} id={id}>
      <div className="page-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <p>{intro}</p>
        </div>
        {children}
        <div className="section-action">
          <ActionLink href={actionHref}>{actionLabel}</ActionLink>
        </div>
      </div>
    </section>
  );
}
