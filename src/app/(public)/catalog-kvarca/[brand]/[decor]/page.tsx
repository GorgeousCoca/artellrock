import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { StoneGallery } from "@/components/catalog/stone-gallery";
import styles from "@/components/catalog/stone-detail.module.scss";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHead } from "@/components/site/page-head";
import { pages } from "@/content/artellrock";
import { formatRub } from "@/lib/calculator/format";
import { catalogStoneRoutes, getStoneCatalogDecor, stoneDescriptionText } from "@/lib/catalog/quartz-catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";
import { excerptText } from "@/lib/utils";

type PageProps = {
  params: Promise<{ brand: string; decor: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return catalogStoneRoutes().map((stone) => ({ brand: stone.brandSlug, decor: stone.slug }));
}

const loadStone = cache((brandSlug: string, decorSlug: string) => getStoneCatalogDecor(brandSlug, decorSlug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand: brandSlug, decor: decorSlug } = await params;
  const loaded = await loadStone(brandSlug, decorSlug);
  if (!loaded) return {};

  const { brand, stone, decor } = loaded;
  const price = decor.price != null ? ` ${formatRub(decor.price)} / м².` : "";
  const description = stoneDescriptionText(stone.description);
  const lead = description
    ? excerptText(`${description}${price ? ` ${price}` : ""}`, 150)
    : `${brand.name} ${stone.name} — кварцевый агломерат.${price} Образцы на бесплатном замере ArtellRock.`;

  return buildMetadata({
    title: `${brand.name} ${stone.name} — кварц, цена за м² — ArtellRock`,
    description: lead,
    path: `/catalog-kvarca/${brand.slug}/${stone.slug}`,
    image: stone.images[0] || decor.image
  });
}

export default async function StonePage({ params }: PageProps) {
  const { brand: brandSlug, decor: decorSlug } = await params;
  const loaded = await loadStone(brandSlug, decorSlug);
  if (!loaded) notFound();

  const { brand, stone, decor } = loaded;
  const path = `/catalog-kvarca/${brand.slug}/${stone.slug}`;
  const crumbs: BreadcrumbItem[] = [
    { name: "Главная", path: "/" },
    { name: pages.catalog.title, path: "/catalog-kvarca" },
    { name: brand.name, path: `/catalog-kvarca/${brand.slug}` },
    { name: stone.name, path }
  ];
  const description = stoneDescriptionText(stone.description);
  const lead = description
    ? excerptText(description, 220)
    : "Кварцевый агломерат для столешниц, фартуков и подоконников.";
  const images = stone.images.length > 0 ? stone.images : [decor.image];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead
        title={`${brand.name} ${stone.name}`}
        lead={lead}
        crumbs={crumbs}
      />
      <div className="page block">
        <div className={styles.layout}>
          <StoneGallery images={images} name={`${brand.name} ${stone.name}`} />

          <div className={styles.facts}>
            <p className={styles.price}>
              {decor.price != null ? `${formatRub(decor.price)} / м²` : "Цена по запросу"}
            </p>
            {decor.sku || stone.sku ? <p>Артикул {decor.sku || stone.sku}</p> : null}
            {stone.characteristics.length > 0 ? (
              <ul className={styles.specs}>
                {stone.characteristics.map((item) => (
                  <li key={`${item.title}-${item.value}`}>
                    <span>{item.title}</span>
                    <span>{item.value}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className={styles.actions}>
              <Link className="btn btn--primary" href="/kalkulyator">
                Предварительный расчёт
              </Link>
              <Link className="btn btn--secondary" href={`/catalog-kvarca/${brand.slug}`}>
                Все декоры {brand.name}
              </Link>
            </div>
          </div>
        </div>

        {description && description !== lead ? (
          <div className={styles.copy}>
            <p>{description}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
