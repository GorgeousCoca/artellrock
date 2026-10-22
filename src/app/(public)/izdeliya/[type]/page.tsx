import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CalculatorWizard } from "@/components/calculator/calculator-wizard";
import {
  DirectionDetails,
  DirectionEdgePromo,
  DirectionHero,
  DirectionIntro,
  DirectionPrice,
  DirectionSwatches,
  DirectionVariants
} from "@/components/direction/direction-blocks";
import { LeadSection } from "@/components/home/lead-section";
import { FaqSection } from "@/components/home/faq-section";
import { InnerSteps, LinkGrid } from "@/components/site/inner-layout";
import { WorksRail } from "@/components/home/works-rail";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionHead } from "@/components/site/section-head";
import {
  directionDescription,
  directionDocumentTitle,
  directionFaq,
  directionH1,
  directions,
  getDirection,
  pages,
  productCatalog
} from "@/content/artellrock";
import { directionBlocks, directionIdeas } from "@/content/direction-blocks";
import { getCalculatorCatalog } from "@/lib/calculator/server";
import { reelSlides } from "@/lib/catalog/quartz-catalog";
import { worksMatching } from "@/lib/portfolio";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd, howToJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

type PageProps = {
  params: Promise<{ type: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return directions.map((direction) => ({ type: direction.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const direction = getDirection(type);
  if (!direction) return {};

  return buildMetadata({
    title: directionDocumentTitle(direction),
    description: directionDescription(direction),
    path: `/izdeliya/${direction.slug}`,
    image: direction.image
  });
}

/** Двенадцать расцветок из каталога, равномерно по списку, чтобы в сетку попали разные бренды. */
function pickSwatches(count: number) {
  const slides = reelSlides();
  if (slides.length <= count) return slides;
  return Array.from({ length: count }, (_, index) => slides[Math.floor((index * slides.length) / count)]);
}

export default async function DirectionPage({ params }: PageProps) {
  const { type } = await params;
  const direction = getDirection(type);
  if (!direction) notFound();

  const questions = directionFaq(direction);
  const path = `/izdeliya/${direction.slug}`;
  const name = direction.title.toLowerCase();
  const crumbs: BreadcrumbItem[] = [
    { name: "Главная", path: "/" },
    { name: pages.products.title, path: "/izdeliya" },
    { name: directionH1(direction), path }
  ];

  const calculatorCatalog = await getCalculatorCatalog();

  const matched = worksMatching((work) => {
    if (direction.workIds) return direction.workIds.includes(work.id);
    return direction.workMatch ? direction.workMatch.test(work.label) : false;
  });
  const gallery = matched.length ? matched : [{ id: direction.slug, image: direction.image, label: direction.imageAlt }];
  const heroGallery = gallery.slice(0, 4);
  const rest = matched.slice(heroGallery.length, heroGallery.length + 12);

  const variants = productCatalog.filter((card) => card.href.startsWith(`${path}#`));
  return (
    <>
      <JsonLd
        data={[breadcrumbJsonLd(crumbs), faqPageJsonLd(questions, `${path}#voprosy`), howToJsonLd(path)]}
      />

      <div className="page back-row">
        <Breadcrumbs items={crumbs} />
      </div>

      <DirectionHero title={directionH1(direction)} line={direction.pageLine} gallery={heroGallery} />

      <DirectionIntro name={name} idea={directionIdeas[direction.slug]} />

      <DirectionVariants cards={variants} />

      <DirectionDetails sections={direction.sections ?? []} />

      <DirectionSwatches slides={pickSwatches(12)} />

      <DirectionEdgePromo />

      <DirectionPrice name={name} />

      {rest.length > 0 ? (
        <section className="page block" aria-labelledby="direction-works-title">
          <SectionHead id="direction-works-title" title={pages.direction.works} />
          <WorksRail works={rest} label={pages.direction.works} />
        </section>
      ) : null}

      <section className="page block" aria-labelledby="direction-calc">
        <SectionHead id="direction-calc" title={directionBlocks.calcTitle} lead={directionBlocks.calcLead} />
        <CalculatorWizard catalog={calculatorCatalog} />
      </section>

      {direction.related && direction.related.length > 0 ? (
        <section className="page block" aria-labelledby="direction-related">
          <SectionHead id="direction-related" title="Смежные страницы" />
          <LinkGrid items={direction.related} />
        </section>
      ) : null}

      <InnerSteps />
      <FaqSection items={questions} />

      <div className="block">
        <LeadSection source={`direction:${direction.slug}`} />
      </div>
    </>
  );
}
