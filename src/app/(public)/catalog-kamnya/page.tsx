import { Suspense } from "react";

import { StoneBrandsClient } from "@/components/catalog/stone-brands-client";
import { StoneCatalogBrandRedirect } from "@/components/catalog/stone-catalog-brand-redirect";
import styles from "@/components/catalog/stone-brands.module.scss";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Каталог камня",
  description: "Каталог кварцевого агломерата по брендам, цветам, фактурам и толщине.",
  path: "/catalog-kamnya"
});

export default function StoneCatalogPage() {
  return (
    <section className={`section ${styles.catalogPageTheme}`}>
      <Suspense fallback={null}>
        <StoneCatalogBrandRedirect />
      </Suspense>
      <StoneBrandsClient />
    </section>
  );
}
