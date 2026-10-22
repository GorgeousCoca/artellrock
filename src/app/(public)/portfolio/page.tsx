import type { Metadata } from "next";

import "@astryxdesign/core/astryx.css";
import "@astryxdesign/core/reset.css";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHead } from "@/components/site/page-head";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { pages } from "@/content/artellrock";
import { groupPortfolio, loadPortfolioWorks } from "@/lib/portfolio";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.works.title, path: "/portfolio" }
];

export async function generateMetadata(): Promise<Metadata> {
  const works = await loadPortfolioWorks();

  return buildMetadata({
    title: "Наши работы: столешницы и фартуки из кварца — ArtellRock",
    description: pages.works.description,
    path: "/portfolio",
    image: works[0]?.image
  });
}

export default async function WorksPage() {
  const groups = groupPortfolio(await loadPortfolioWorks());

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={pages.works.title} lead={pages.works.lead} crumbs={crumbs} align="center" />
      <section className="page block">
        <PortfolioGallery groups={groups} />
      </section>
    </>
  );
}
