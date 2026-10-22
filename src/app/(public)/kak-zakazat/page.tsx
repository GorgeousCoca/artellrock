import Link from "next/link";
import { Columns3, CookingPot, FileText, Palette } from "lucide-react";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import {
  AsideNote,
  BentoFive,
  ChecklistTiles,
  Split,
  Stack,
  StatRow
} from "@/components/site/inner-layout";
import { OrderHero } from "@/components/site/order-hero";
import { SectionHead } from "@/components/site/section-head";
import { guideStyles } from "@/components/site/guide-blocks";
import { orderPage as page } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: page.crumb, path: page.path }
];

const prepareIcons = [Palette, CookingPot, Columns3, FileText] as const;

export const metadata = buildMetadata({
  title: page.documentTitle,
  description: page.description,
  path: page.path
});

export default function OrderPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <OrderHero
        title={page.h1}
        subtitle={page.subtitle}
        lead={page.lead}
        waysTitle={page.waysTitle}
        ways={page.ways}
        crumbs={crumbs}
      />

      <section className="page block" aria-labelledby="order-steps">
        <SectionHead id="order-steps" title={page.stepsTitle} lead={page.stepsLead} />
        <BentoFive items={page.steps} numbered />
      </section>

      <Split id="order-prepare" title={page.prepareTitle}>
        <ChecklistTiles items={page.prepare} icons={prepareIcons} />
      </Split>

      <section className="page block" aria-labelledby="order-terms">
        <SectionHead id="order-terms" title={page.termsTitle} lead={page.included} />
        <Stack>
          <StatRow items={page.termsStats} />
          <AsideNote>{page.termsNote}</AsideNote>
          <div className={guideStyles.actions}>
            <Link className="btn btn--secondary" href="/oplata-i-dostavka">
              Оплата и доставка
            </Link>
            <Link className="btn btn--secondary" href="/akcii">
              Акции
            </Link>
          </div>
        </Stack>
      </section>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:order" />
      </div>
    </>
  );
}
