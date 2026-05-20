import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Страница не найдена — ArtellRock",
  description:
    "Запрашиваемая страница отсутствует или ссылка устарела. Перейдите в каталог изделий из кварцевого агломерата или на главную.",
  skipCanonical: true,
  noIndex: true
});

export default async function NotFound() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="card stack">
            <span className="eyebrow">404</span>
            <h1>Страница не найдена</h1>
            <p>Возможно, материал был перенесен или ссылка устарела.</p>
            <div className="btn-row">
              <Link className="button" href="/">
                На главную
              </Link>
              <Link className="button-secondary" href="/catalog">
                В каталог
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
