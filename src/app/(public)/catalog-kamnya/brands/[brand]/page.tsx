import { notFound } from "next/navigation";

import { BrandPageHero } from "@/components/catalog/brand-page-hero";
import { BrandStonesGrid } from "@/components/catalog/brand-stones-grid";
import { HomeFaqSection } from "@/components/faq/home-faq-section";
import styles from "@/components/catalog/stone-brands.module.scss";
import { buildMetadata } from "@/lib/seo/metadata";
import { brandPageDescriptionSummary, getBrandPageCopy } from "@/lib/stone/brand-page-copy";
import { getStoneBrands, manufacturerToSlug } from "@/lib/stone/brands";
import { getFaqItems, getStoneSamples } from "@/lib/site";

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
    description: `${brandPageDescriptionSummary(activeBrand.slug, activeBrand.name)} Каталог декоров и цен.`,
    path: `/catalog-kamnya/brands/${activeBrand.slug}`,
    image: heroImage
  });
}

export default async function BrandCatalogPage({ params }: PageProps) {
  const { brand } = await params;
  const [stones, faqItems] = await Promise.all([getStoneSamples(), getFaqItems()]);
  const brands = getStoneBrands(stones);
  const activeBrand = brands.find((item) => item.slug === brand);

  if (!activeBrand) {
    notFound();
  }

  const brandStones = stones.filter((stone) => manufacturerToSlug(stone.manufacturer) === brand);
  const brandCopy = getBrandPageCopy(activeBrand.slug, activeBrand.name);

  return (
    <>
      <BrandPageHero slug={activeBrand.slug} copy={brandCopy} />
      <section className={`section ${styles.brandPageCatalog}`}>
        <div className="container">
          <p className={`section-copy ${styles.brandCatalogIntro}`}>
            В каталоге {activeBrand.count} позиций. Нажмите на декор, чтобы запросить консультацию
            и расчёт стоимости.
          </p>
          <BrandStonesGrid stones={brandStones} />
        </div>
      </section>

      <HomeFaqSection items={faqItems} standalone />
    </>
  );
}
