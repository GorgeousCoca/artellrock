import Link from "next/link";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { GuideProse, GuideSpecTable, guideStyles } from "@/components/site/guide-blocks";
import { AsideNote, BentoFive, CardGrid, Split, Stack, StatRow } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import { paymentPage as page } from "@/content/terms";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: page.crumb, path: page.path }
];

export const metadata = buildMetadata({
  title: page.documentTitle,
  description: page.description,
  path: page.path
});

export default function PaymentPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      <Split id="pay-title" title={page.paymentTitle}>
        <Stack>
          <StatRow items={page.paymentStats} />
          <GuideProse paragraphs={page.paymentText} />
          <CardGrid items={page.methods} />
          <AsideNote>Скидки и сезонные предложения собраны на странице «Акции».</AsideNote>
          <div className={guideStyles.actions}>
            <Link className="btn btn--secondary" href="/akcii">
              Акции
            </Link>
          </div>
        </Stack>
      </Split>

      <Split id="delivery-title" title={page.deliveryTitle}>
        <Stack>
          <GuideProse paragraphs={page.deliveryText} />
          <GuideSpecTable rows={page.deliveryRows} caption="Стоимость доставки и монтажа" headings={["Услуга", "Стоимость"]} />
          <p className="price-note">{page.deliveryNote}</p>
        </Stack>
      </Split>

      <section className="page block" aria-labelledby="pay-steps">
        <SectionHead id="pay-steps" title={page.stepsTitle} />
        <BentoFive items={page.steps} numbered />
        <div className={guideStyles.actions}>
          <Link className="btn btn--primary" href="/kalkulyator">
            Посчитать в калькуляторе
          </Link>
          <Link className="btn btn--secondary" href="/kak-zakazat">
            Как заказать
          </Link>
        </div>
      </section>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:payment" />
      </div>
    </>
  );
}
