"use client";

import Link from "next/link";

type AppErrorFallbackProps = {
  title: string;
  description?: string;
  reset?: () => void;
  eyebrow?: string;
};

export function AppErrorFallback({ title, description, reset, eyebrow = "Ошибка" }: AppErrorFallbackProps) {
  return (
    <section className="page not-found">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="t-display-lg">{title}</h1>
      {description ? <p className="t-lead-airy">{description}</p> : null}
      <div className="hero__actions">
        {reset ? (
          <button type="button" className="btn btn--primary" onClick={() => reset()}>
            Попробовать снова
          </button>
        ) : null}
        <Link className="btn btn--secondary" href="/">
          На главную
        </Link>
      </div>
    </section>
  );
}
