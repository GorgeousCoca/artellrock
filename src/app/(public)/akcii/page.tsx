import Link from "next/link";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { EmptyNote, PromoCards, guideStyles } from "@/components/site/guide-blocks";
import { Split, Stack } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { promotionsPage as page } from "@/content/terms";
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

export default function PromotionsPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      <Split id="promo-permanent" title={page.permanentTitle}>
        <Stack>
          <PromoCards items={page.permanent} />
          <div className={guideStyles.actions}>
            <Link className="btn btn--primary" href="/kalkulyator">
              Посчитать в калькуляторе
            </Link>
            <Link className="btn btn--secondary" href="/oplata-i-dostavka">
              Оплата и доставка
            </Link>
          </div>
        </Stack>
      </Split>

      <Split id="promo-seasonal" title={page.seasonalTitle}>
        {page.seasonal.length > 0 ? <PromoCards items={page.seasonal} /> : <EmptyNote>{page.seasonalEmpty}</EmptyNote>}
      </Split>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:promo" />
      </div>
    </>
  );
}
