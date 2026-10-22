import Link from "next/link";

import { ProductCatalog } from "@/components/catalog/product-catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import { pages } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.products.title, path: "/izdeliya" }
];

export const metadata = buildMetadata({
  title: pages.products.documentTitle,
  description: pages.products.description,
  path: "/izdeliya"
});

export default function ProductsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={pages.products.title} lead={pages.products.lead} crumbs={crumbs} />
      <div className="page">
        <ProductCatalog />
      </div>
      <section className="page block" aria-labelledby="order-title">
        <SectionHead id="order-title" title={pages.products.orderTitle} lead={pages.products.orderLead} />
        <div className="guide-actions">
          <Link className="btn btn--secondary" href="/portfolio">
            Наши работы
          </Link>
          <Link className="btn btn--secondary" href="/catalog-kvarca">
            Каталог кварца
          </Link>
          <Link className="btn btn--primary" href="/kalkulyator">
            Калькулятор
          </Link>
          <Link className="btn btn--secondary" href="/contacts">
            Контакты
          </Link>
        </div>
      </section>
    </>
  );
}
