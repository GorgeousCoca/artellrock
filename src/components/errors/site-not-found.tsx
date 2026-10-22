import Link from "next/link";

export function SiteNotFound() {
  return (
    <section className="page not-found">
      <span className="eyebrow">404</span>
      <h1 className="t-display-lg">Страница не найдена</h1>
      <div className="hero__actions">
        <Link className="btn btn--primary" href="/">
          На главную
        </Link>
        <Link className="btn btn--secondary" href="/izdeliya">
          Изделия
        </Link>
      </div>
    </section>
  );
}
