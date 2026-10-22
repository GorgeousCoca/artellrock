import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { QuartzBrandCatalog } from "@/components/catalog/quartz-brand-catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { guideStyles } from "@/components/site/guide-blocks";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import { pages } from "@/content/artellrock";
import { catalogBrandSlugs, getBrandCatalog } from "@/lib/catalog/quartz-catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import { brandProductJsonLd, breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";
import { brandDocumentTitle, brandHeading, brandMetaDescription, brandPageLead } from "@/lib/seo/snippets";

type PageProps = {
  params: Promise<{ brand: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return catalogBrandSlugs().map((brand) => ({ brand }));
}

const loadBrand = cache((slug: string) => getBrandCatalog(slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand: slug } = await params;
  const loaded = await loadBrand(slug);
  if (!loaded) return {};

  const { brand, span } = loaded;

  return buildMetadata({
    title: brandDocumentTitle(brand.name),
    description: brandMetaDescription(brand.name, span),
    path: `/catalog-kvarca/${brand.slug}`,
    image: brand.firstImage
  });
}

export default async function BrandPage({ params }: PageProps) {
  const { brand: slug } = await params;
  const loaded = await loadBrand(slug);
  if (!loaded) notFound();

  const { brand, decors, span, pricedCount: priced } = loaded;
  const path = `/catalog-kvarca/${brand.slug}`;
  const crumbs: BreadcrumbItem[] = [
    { name: "Главная", path: "/" },
    { name: pages.catalog.title, path: "/catalog-kvarca" },
    { name: brand.name, path }
  ];
  const productLd = brandProductJsonLd({
    name: brand.name,
    path,
    image: brand.firstImage,
    span,
    offerCount: priced
  });

  return (
    <>
      <JsonLd data={productLd ? [breadcrumbJsonLd(crumbs), productLd] : breadcrumbJsonLd(crumbs)} />
      <PageHead title={brandHeading(brand.name)} lead={brandPageLead(brand.name)} crumbs={crumbs} />
      <div className="page">
        <SectionHead id="decors-title" title={`Декоры ${brand.name}`} />
        <QuartzBrandCatalog brandName={brand.name} brandSlug={brand.slug} decors={decors} />
        <div className={guideStyles.actions}>
          <Link className="btn btn--primary" href="/kalkulyator">
            Посчитать в калькуляторе
          </Link>
          <Link className="btn btn--secondary" href="/tseny">
            Прайс-лист
          </Link>
        </div>
      </div>
    </>
  );
}
