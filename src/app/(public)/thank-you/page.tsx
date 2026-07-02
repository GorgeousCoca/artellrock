import Link from "next/link";

import { PageHero } from "@/components/ui/content";
import { getPrimaryCompanyPhone, toTelHref } from "@/lib/company-phones";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSettings } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Заявка отправлена — спасибо за обращение",
  description:
    "Мы получили вашу заявку и свяжемся с вами после обработки запроса. ArtellRock — изделия из кварцевого агломерата.",
  path: "/thank-you"
});

export default async function ThankYouPage() {
  const settings = await getSettings();
  const phone = getPrimaryCompanyPhone(settings);

  return (
    <>
      <PageHero
        eyebrow="Заявка отправлена"
        title="Спасибо за обращение"
        description={
          <>
            Мы получили вашу заявку и свяжемся с вами в ближайшее рабочее время.
            {phone ? (
              <>
                {" "}
                Или позвоните:{" "}
                <a href={toTelHref(phone)}>{phone}</a>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Link className="button" href="/">
              На главную
            </Link>
            <Link className="button-secondary" href="/portfolio">
              Посмотреть проекты
            </Link>
            <Link className="button-secondary" href="/catalog/countertops">
              Каталог изделий
            </Link>
          </>
        }
      />

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: "var(--prose-max)" }}>
          <p className="muted">
            Пока ждёте ответ — загляните в{" "}
            <Link href="/faq">частые вопросы</Link> о замере, сроках и материалах.
          </p>
        </div>
      </section>
    </>
  );
}
