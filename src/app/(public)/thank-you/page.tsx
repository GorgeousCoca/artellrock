import Link from "next/link";

import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Заявка отправлена — спасибо за обращение",
  description:
    "Мы получили вашу заявку и свяжемся с вами после обработки запроса. ArtellRock — изделия из кварцевого агломерата.",
  path: "/thank-you"
});

export default function ThankYouPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="card stack">
          <span className="eyebrow">Заявка отправлена</span>
          <h1>Спасибо за обращение</h1>
          <p>Мы получили вашу заявку и свяжемся с вами после обработки запроса.</p>
          <div className="btn-row">
            <Link className="button" href="/">
              На главную
            </Link>
            <Link className="button-secondary" href="/portfolio">
              Посмотреть проекты
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
