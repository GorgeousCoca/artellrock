import Link from "next/link";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageJsonLd } from "@/lib/seo/schema";
import { getFaqItems } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Вопросы и ответы",
  description:
    "Частые вопросы о столешницах и подоконниках из кварцевого агломерата: бесплатный замер, сроки, гарантия, образцы и уход.",
  path: "/faq"
});

export default async function FaqPage() {
  const items = await getFaqItems();
  const pageUrl = absoluteUrl("/faq");

  return (
    <>
      <JsonLd data={faqPageJsonLd(items, pageUrl)} />
      <PageHero
        eyebrow="FAQ"
        title="Вопросы и ответы"
        description="Собрали ответы на типичные вопросы о материале, замере, сроках и стоимости. Если не нашли нужное — напишите нам."
        actions={
          <>
            <Link className="button" href="/contacts">
              Задать вопрос
            </Link>
            <ConsultationButton source="faq-hero" className="button-secondary">
              Получить консультацию
            </ConsultationButton>
          </>
        }
      />

      <section className="section section-alt">
        <div className="container" style={{ maxWidth: "var(--prose-max)" }}>
          <FaqAccordion items={items} />
        </div>
      </section>
    </>
  );
}
