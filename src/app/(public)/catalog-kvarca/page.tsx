import Link from "next/link";

import { CatalogReel } from "@/components/catalog/catalog-reel";
import { QuartzCatalogExtra } from "@/components/catalog/quartz-catalog-extra";
import { QuartzIntro } from "@/components/catalog/quartz-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Photo } from "@/components/site/photo";
import { pages } from "@/content/artellrock";
import { formatRub } from "@/lib/calculator/format";
import { brandCount, listBrandCards, type BrandCard } from "@/lib/catalog/quartz-catalog";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";
import { catalogMetaDescription } from "@/lib/seo/snippets";

function brandPriceLabel(span: BrandCard["span"]) {
  if (!span) return "Цена по запросу";
  if (span.min === span.max) return `${formatRub(span.min)} / м²`;
  return `от ${formatRub(span.min)} до ${formatRub(span.max)} / м²`;
}

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.catalog.title, path: "/catalog-kvarca" }
];

export const metadata = buildMetadata({
  title: "Каталог кварцевого агломерата в Петербурге — ArtellRock",
  description: catalogMetaDescription(brandCount()),
  path: "/catalog-kvarca"
});

export default async function CatalogPage() {
  const brands = await listBrandCards();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <header className="page page-head page-head--crumbs">
        <Breadcrumbs items={crumbs} />
      </header>
      <div className="page">
        <QuartzIntro />
        <CatalogReel />
        <h2 className="catalog-brands__title">Производители кварцевого агломерата</h2>
        <ul className="card-grid">
          {brands.map((brand) => (
              <li key={brand.slug} className="card brand-card">
                <div className="card__media brand-card__mosaic">
                  {brand.preview.map((decor) => (
                    <div key={decor.image} className="brand-card__cell">
                      <Photo
                        src={decor.image}
                        alt={`${brand.name} ${decor.name}`}
                        sizes="(max-width: 570px) 50vw, (max-width: 1000px) 25vw, 17vw"
                      />
                    </div>
                  ))}
                </div>
                <div className="card__body">
                  <h3 className="t-tagline">
                    <Link className="card__link" href={`/catalog-kvarca/${brand.slug}`}>
                      {brand.name}
                    </Link>
                  </h3>
                  <p className="brand-card__price">{brandPriceLabel(brand.span)}</p>
                  <span className="text-link text-link--arrow">Смотреть декоры</span>
                </div>
              </li>
            ))}
        </ul>
        <QuartzCatalogExtra />
      </div>
    </>
  );
}
