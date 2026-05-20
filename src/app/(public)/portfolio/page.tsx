import dynamic from "next/dynamic";
import Link from "next/link";

import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { getProjects, getTestimonials } from "@/lib/site";

const BrandCarousels = dynamic(
  () => import("@/components/portfolio/brand-carousels").then((m) => m.BrandCarousels),
  { loading: () => <div className="card card--glass" style={{ minHeight: 140 }} aria-hidden /> }
);

const TestimonialsShowcase = dynamic(
  () => import("@/components/portfolio/testimonials-showcase").then((m) => m.TestimonialsShowcase),
  { loading: () => <div className="card card--glass" style={{ minHeight: 120 }} aria-hidden /> }
);

const PortfolioListClient = dynamic(
  () => import("@/components/catalog/portfolio-list-client").then((m) => m.PortfolioListClient),
  { loading: () => <div className="card card--glass">Загрузка проектов…</div> }
);

export const metadata = buildMetadata({
  title: "Портфолио изделий из искусственного камня",
  description: "Галерея выполненных проектов: кухни, ванные комнаты и коммерческие пространства.",
  path: "/portfolio"
});

export default async function PortfolioPage() {
  const [projects, testimonials] = await Promise.all([getProjects(), getTestimonials()]);

  return (
    <>
      <PageHero
        eyebrow="Портфолио"
        title="Портфолио выполненных проектов"
        titleClassName="catalog-category-hero-title"
        descriptionClassName="page-hero__lead"
        description="Галерея реализованных работ: кухни, ванные комнаты и коммерческие пространства из кварцевого агломерата."
        visualImageSrc="/images/portfolio-brands/Avant_Quartz-01.jpg"
        visualImageAlt="Портфолио изделий из кварцевого агломерата"
        visualBadgeText="Real projects. Clean detailing."
        actions={
          <>
            <Link className="button" href="/calculator">
              Рассчитать стоимость
            </Link>
            <Link className="button-secondary" href="/catalog-kamnya">
              Перейти в каталог камня
            </Link>
          </>
        }
      />

      <section className="section">
        <div className="container">
          <BrandCarousels />
          <TestimonialsShowcase testimonials={testimonials} />
          <PortfolioListClient projects={projects} />
        </div>
      </section>
    </>
  );
}
