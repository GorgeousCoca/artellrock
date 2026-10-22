import Link from "next/link";

import { FaqSection } from "@/components/home/faq-section";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Minus, Ruler, Spline, Shield } from "lucide-react";

import { EdgeCard, GuideCards, guideStyles } from "@/components/site/guide-blocks";
import { ChecklistTiles, Split, Stack } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import { edgesPage as page, profileNote, thicknessNote } from "@/content/guides";
import { getCalculatorCatalog } from "@/lib/calculator/server";
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

export default async function EdgesPage() {
  const catalog = await getCalculatorCatalog();
  const profiles = catalog.edges.filter((edge) => edge.kind === "profile");
  const thicknesses = catalog.edges.filter((edge) => edge.kind === "thickness");

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(page.faq, `${page.path}#voprosy`)]} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      {profiles.length > 0 ? (
        <section className="page block" aria-labelledby="edges-profiles">
          <SectionHead id="edges-profiles" title={page.profilesTitle} lead={page.profilesLead} />
          <div className={guideStyles.grid}>
            {profiles.map((edge) => (
              <EdgeCard
                key={edge.id}
                name={edge.name}
                note={profileNote(edge.name)}
                image={edge.image}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="page block" aria-labelledby="edges-thickness">
        <SectionHead id="edges-thickness" title={page.thicknessTitle} lead={page.thicknessLead} />
        <GuideCards items={page.thicknessMethods} />
        {thicknesses.length > 0 ? (
          <div className={guideStyles.grid} style={{ marginTop: "var(--s-lg)" }}>
            {thicknesses.map((edge) => (
              <EdgeCard
                key={edge.id}
                name={edge.name}
                note={thicknessNote(edge.name)}
                image={edge.image}
              />
            ))}
          </div>
        ) : null}
      </section>

      {catalog.backsplashes.length > 0 ? (
        <section className="page block" aria-labelledby="edges-backsplash">
          <SectionHead id="edges-backsplash" title={page.backsplashTitle} lead={page.backsplashLead} />
          <div className={guideStyles.grid}>
            {catalog.backsplashes.map((item) => (
              <EdgeCard
                key={item.id}
                name={item.name}
                image={item.image}
              />
            ))}
          </div>
        </section>
      ) : null}

      <Split id="edges-choose" title={page.chooseTitle}>
        <Stack>
          <ChecklistTiles items={page.choose} icons={[Shield, Minus, Spline, Ruler]} />
          <p className="price-note">
            {page.priceNote}{" "}
            <Link className="text-link" href="/tseny">
              «Цены»
            </Link>
            .
          </p>
          <div className={guideStyles.actions}>
            <Link className="btn btn--primary" href="/kalkulyator">
              Посчитать в калькуляторе
            </Link>
            <Link className="btn btn--secondary" href="/izdeliya/stoleshnitsy">
              Столешницы
            </Link>
          </div>
        </Stack>
      </Split>

      <FaqSection items={page.faq} title={page.faqTitle} />

      <div className="block">
        <LeadSection source="guide:edges" />
      </div>
    </>
  );
}
