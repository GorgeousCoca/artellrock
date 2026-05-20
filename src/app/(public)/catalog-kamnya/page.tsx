import dynamic from "next/dynamic";

import styles from "@/components/catalog/stone-brands.module.scss";
import { buildMetadata } from "@/lib/seo/metadata";
import { getStoneBrands } from "@/lib/stone/brands";
import { getStoneSamples } from "@/lib/site";

const StoneBrandsClient = dynamic(
  () => import("@/components/catalog/stone-brands-client").then((m) => m.StoneBrandsClient),
  {
    loading: () => (
      <div className={styles.catalogFallback} aria-hidden="true">
        <div className={`${styles.fallbackLine} ${styles.fallbackLineShort}`} />
        <div className={`${styles.fallbackLine} ${styles.fallbackLineWide}`} />
        <div className={`${styles.fallbackLine} ${styles.fallbackLineMedium}`} />
        <div className={styles.fallbackGrid}>
          <div className={styles.fallbackCard} />
          <div className={styles.fallbackCard} />
          <div className={styles.fallbackCard} />
          <div className={styles.fallbackCard} />
          <div className={styles.fallbackCard} />
          <div className={styles.fallbackCard} />
        </div>
      </div>
    )
  }
);

export const metadata = buildMetadata({
  title: "Каталог камня",
  description: "Каталог кварцевого агломерата по брендам, цветам, фактурам и толщине.",
  path: "/catalog-kamnya"
});

export default async function StoneCatalogPage() {
  const stones = await getStoneSamples();
  const brands = getStoneBrands(stones);

  return (
    <section className={`section ${styles.catalogPageTheme}`}>
      <div className="container">
        <StoneBrandsClient stones={stones} brands={brands} />
      </div>
    </section>
  );
}
