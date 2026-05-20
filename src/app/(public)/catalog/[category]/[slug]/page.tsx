import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ContactForm } from "@/components/forms/contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { productJsonLd } from "@/lib/seo/schema";
import { getProductBySlug, getProducts, getProjects } from "@/lib/site";
import { absoluteUrl, formatPrice } from "@/lib/utils";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug, category } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return buildMetadata({
    title: product.metaTitle ?? product.title,
    description: product.metaDescription ?? product.summary,
    path: `/catalog/${category}/${slug}`,
    image: product.ogImage ?? product.image,
    noIndex: product.noIndex
  });
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({
    category: product.type,
    slug: product.slug
  }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const [product, projects] = await Promise.all([getProductBySlug(slug), getProjects()]);

  if (!product || product.type !== category) {
    notFound();
  }

  const relatedProjects = projects.filter((project) => project.productRefs.includes(product.slug)).slice(0, 2);

  const pageUrl = absoluteUrl(`/catalog/${category}/${slug}`);

  return (
    <>
      <JsonLd data={productJsonLd(product, pageUrl)} />
      <PageHero
        eyebrow="Карточка изделия"
        title={product.title}
        description={product.description}
        actions={
          <>
            <span className="pill">от {formatPrice(product.basePrice)} руб.</span>
            <Link className="button" href="/calculator">
              Рассчитать стоимость
            </Link>
          </>
        }
      />

      <section className="section">
        <div className="container grid grid-2">
          <div className="stack">
            <div className="card media-card">
              <Image
                className="media-image"
                src={
                  product.type === "countertops" || product.type === "sinks"
                    ? "/images/quartz-project-composition.svg"
                    : "/images/quartz-surface-light.svg"
                }
                alt={product.title}
                width={1400}
                height={980}
                style={{ height: 360 }}
              />
              <div className="media-card__content">
                <div className="pill-list">
                  <span className="pill">{product.material}</span>
                  <span className="pill">{product.color}</span>
                  <span className="pill">{product.thickness}</span>
                </div>
              </div>
            </div>
            <div className="card stack">
              <h2>Особенности изделия</h2>
              <div className="pill-list">
                {product.features.map((feature) => (
                  <span key={feature} className="pill">
                    {feature}
                  </span>
                ))}
              </div>
              <p>{product.summary}</p>
            </div>
          </div>

          <div className="stack">
            <div className="card stack">
              <h2>Что входит в проект</h2>
              <p>Замер, подготовка чертежей, производство, доставка и монтаж изделия на объекте.</p>
            </div>

            {relatedProjects.length ? (
              <div className="card stack">
                <h2>Связанные проекты</h2>
                {relatedProjects.map((project) => (
                  <Link key={project.id} href={`/portfolio/${project.slug}`}>
                    {project.title}
                  </Link>
                ))}
              </div>
            ) : null}

            <ContactForm source={`product:${product.slug}`} compact />
          </div>
        </div>
      </section>
    </>
  );
}
