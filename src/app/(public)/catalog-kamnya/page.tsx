import { redirect } from "next/navigation";

import { StoneBrandsClient } from "@/components/catalog/stone-brands-client";
import styles from "@/components/catalog/stone-brands.module.scss";
import { buildMetadata } from "@/lib/seo/metadata";
import { brandCatalogHref } from "@/lib/stone/brands";

type PageProps = {
  searchParams: Promise<{ brand?: string }>;
};

export const metadata = buildMetadata({
  title: "Каталог камня",
  description: "Каталог кварцевого агломерата по брендам, цветам, фактурам и толщине.",
  path: "/catalog-kamnya"
});

export default async function StoneCatalogPage({ searchParams }: PageProps) {
  const { brand } = await searchParams;

  if (brand) {
    redirect(brandCatalogHref(brand));
  }

  return (
    <section className={`section ${styles.catalogPageTheme}`}>
      <StoneBrandsClient />
    </section>
  );
}
