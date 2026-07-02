import { PortfolioPageContent } from "@/components/portfolio/portfolio-page-content";
import { buildMetadata } from "@/lib/seo/metadata";
import { getApprovedTestimonials } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Портфолио изделий из искусственного камня",
  description: "Галерея выполненных проектов: кухни, ванные комнаты и коммерческие пространства.",
  path: "/portfolio"
});

export default async function PortfolioPage() {
  const testimonials = await getApprovedTestimonials();

  return <PortfolioPageContent testimonials={testimonials} />;
}
