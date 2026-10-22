import Link from "next/link";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Ruler, Square, Droplets, Eye } from "lucide-react";

import { EdgeCard, GuideProse, SinkModelCard, guideStyles } from "@/components/site/guide-blocks";
import { CardGrid, ChecklistTiles, Split, Stack } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import { sinkCutoutNotes, sinkSpecFor, sinksPage as page } from "@/content/products-extra";
import { getCalculatorCatalog } from "@/lib/calculator/server";
import { SINK_TYPE_IMAGES } from "@/lib/calculator/taxonomy";
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

export default async function SinksPage() {
  const catalog = await getCalculatorCatalog();
  const models = catalog.sinks.filter((sink) => sink.type === "integrated");
  const cutouts = catalog.sinks.filter((sink) => sink.type !== "integrated");

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      <Split id="sinks-intro" title={page.introTitle}>
        <GuideProse paragraphs={page.intro} />
      </Split>

      {models.length > 0 ? (
        <section className="page block" aria-labelledby="sinks-models">
          <SectionHead id="sinks-models" title={page.modelsTitle} lead={page.modelsLead} />
          <div className={guideStyles.grid}>
            {models.map((sink) => {
              const spec = sinkSpecFor(sink.name);
              return (
                <SinkModelCard
                  key={sink.id}
                  name={sink.name}
                  summary={spec?.summary}
                  rows={spec?.rows ?? (sink.description ? [{ name: "Размеры", value: sink.description }] : [])}
                  image={sink.image}
                />
              );
            })}
          </div>
          <p className="price-note" style={{ marginTop: "var(--s-lg)" }}>
            {page.modelsNote} {page.seamNote}
          </p>
        </section>
      ) : null}

      {cutouts.length > 0 ? (
        <section className="page block" aria-labelledby="sinks-cutouts">
          <SectionHead id="sinks-cutouts" title={page.cutoutsTitle} lead={page.cutoutsLead} />
          <div className={guideStyles.grid}>
            {cutouts.map((sink) => (
              <EdgeCard
                key={sink.id}
                name={sink.name}
                note={sink.type === "integrated" ? undefined : sinkCutoutNotes[sink.type]}
                image={sink.image ?? SINK_TYPE_IMAGES[sink.type]}
              />
            ))}
          </div>
        </section>
      ) : null}

      <Split id="sinks-choose" title={page.chooseTitle}>
        <ChecklistTiles items={page.choose} icons={[Square, Droplets, Eye, Ruler]} />
      </Split>

      <Split id="sinks-steps" title="Как заказать мойку">
        <Stack>
          <CardGrid items={page.steps} numbered />
          <div className={guideStyles.actions}>
            <Link className="btn btn--primary" href="/kalkulyator">
              Посчитать в калькуляторе
            </Link>
            <Link className="btn btn--secondary" href="/izdeliya/stoleshnitsy">
              Столешницы
            </Link>
            <Link className="btn btn--secondary" href="/catalog-kvarca">
              Каталог кварца
            </Link>
          </div>
        </Stack>
      </Split>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:sinks" />
      </div>
    </>
  );
}
