import Link from "next/link";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { GuideCompareTable, GuideProse, GuideSpecTable } from "@/components/site/guide-blocks";
import { ActionPanel, CardGrid, LinkBento, Split, Stack, StatRow } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { materialPage as page } from "@/content/guides";
import { formatLegendLabel, STONE_FORMATS } from "@/lib/calculator/taxonomy";
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

const formatRows = STONE_FORMATS.map((format) => ({
  name: `${format.name} (${format.value})`,
  value: `${format.lengthMm} × ${format.widthMm} мм`
}));

export default function QuartzMaterialPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      <Split id="material-benefits" title="Главные свойства">
        <CardGrid items={page.benefits} />
      </Split>

      <Split id="material-composition" title={page.compositionTitle}>
        <Stack>
          <StatRow items={page.highlights} />
          <GuideProse paragraphs={page.composition} />
        </Stack>
      </Split>

      <Split id="material-specs" title={page.specsTitle}>
        <GuideSpecTable rows={page.specs} caption={page.specsTitle} />
      </Split>

      <Split id="material-formats" title={page.formatsTitle} lead={page.formatsNote}>
        <GuideSpecTable
          headings={["Формат плиты", "Размер"]}
          rows={formatRows}
          caption={`${page.formatsTitle}: ${STONE_FORMATS.map((format) => formatLegendLabel(format.value)).join("; ")}`}
        />
      </Split>

      <Split id="material-compare" title={page.compareTitle} lead={page.compareLead}>
        <GuideCompareTable rows={page.compare} caption={page.compareTitle} />
      </Split>

      <Split id="material-use" title={page.useTitle} lead={page.useLead}>
        <LinkBento items={page.useLinks} />
      </Split>

      <ActionPanel id="material-price" title={page.priceTitle} text={page.priceText}>
        <Link className="btn btn--primary" href="/catalog-kvarca">
          Каталог кварца
        </Link>
        <Link className="btn btn--secondary" href="/tseny">
          Прайс-лист
        </Link>
        <Link className="btn btn--secondary" href="/kalkulyator">
          Калькулятор
        </Link>
      </ActionPanel>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:material" />
      </div>
    </>
  );
}
