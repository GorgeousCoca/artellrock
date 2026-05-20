import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandStonesGrid } from "@/components/catalog/brand-stones-grid";
import styles from "@/components/catalog/stone-brands.module.scss";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { getStoneBrands, manufacturerToSlug } from "@/lib/stone/brands";
import { getStoneSamples } from "@/lib/site";

type PageProps = {
  params: Promise<{ brand: string }>;
};

export async function generateStaticParams() {
  const stones = await getStoneSamples();
  const brands = getStoneBrands(stones);
  return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { brand } = await params;
  const stones = await getStoneSamples();
  const brands = getStoneBrands(stones);
  const activeBrand = brands.find((item) => item.slug === brand);

  if (!activeBrand) {
    return {};
  }

  const brandStones = stones.filter((stone) => manufacturerToSlug(stone.manufacturer) === activeBrand.slug);
  const heroImage = brandStones[0]?.ogImage ?? brandStones[0]?.image;

  return buildMetadata({
    title: `Кварцевый агломерат ${activeBrand.name}`,
    description: `${activeBrand.description} Каталог декоров, цветов и ориентировочных цен.`,
    path: `/catalog-kamnya/brands/${activeBrand.slug}`,
    image: heroImage
  });
}

export default async function BrandCatalogPage({ params }: PageProps) {
  const { brand } = await params;
  const stones = await getStoneSamples();
  const brands = getStoneBrands(stones);
  const activeBrand = brands.find((item) => item.slug === brand);

  if (!activeBrand) {
    notFound();
  }

  const brandStones = stones.filter((stone) => manufacturerToSlug(stone.manufacturer) === brand);

  return (
    <>
      <PageHero
        eyebrow="Каталог бренда"
        title={`Кварцевый агломерат ${activeBrand.name}`}
        description={activeBrand.description}
        actions={
          <>
            <Link className="button-secondary" href="/catalog-kamnya">
              К каталогу камня
            </Link>
            <Link className="button" href="/contacts">
              Получить расчет
            </Link>
          </>
        }
      />
      <section className="section">
        <div className="container">
          <div className={styles.brandPageHead}>
            <h1>{activeBrand.name}</h1>
            <p>
              В каталоге {activeBrand.count} позиций. Нажмите на декор, чтобы перейти к калькулятору расчёта
              стоимости.
            </p>
          </div>
          <BrandStonesGrid stones={brandStones} />
        </div>
      </section>
    </>
  );
}
