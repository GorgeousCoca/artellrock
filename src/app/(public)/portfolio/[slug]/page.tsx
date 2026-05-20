import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { creativeWorkProjectJsonLd } from "@/lib/seo/schema";
import { getProjectBySlug, getProjects } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

const LightboxGallery = dynamic(() =>
  import("@/components/ui/lightbox-gallery").then((m) => m.LightboxGallery)
);

const ContactForm = dynamic(() => import("@/components/forms/contact-form").then((m) => m.ContactForm), {
  loading: () => (
    <div className="card card--glass stack" style={{ minHeight: 200 }} aria-busy="true" aria-label="Загрузка формы" />
  )
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return buildMetadata({
    title: project.metaTitle ?? project.title,
    description: project.metaDescription ?? project.summary,
    path: `/portfolio/${slug}`,
    image: project.ogImage ?? project.afterImage ?? project.gallery[0],
    noIndex: project.noIndex
  });
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/portfolio/${slug}`);

  return (
    <>
      <JsonLd data={creativeWorkProjectJsonLd(project, pageUrl)} />
      <PageHero eyebrow={project.category} title={project.title} description={project.description} />

      <section className="section">
        <div className="container grid grid-2">
          <div className="stack">
            <div className="grid grid-2">
              <div className="card media-card">
                <Image
                  className="media-image"
                  src={project.beforeImage ?? "/images/quartz-surface-light.svg"}
                  alt={`${project.title} до монтажа`}
                  width={1200}
                  height={900}
                  style={{ height: 260 }}
                  sizes="(max-width: 900px) 100vw, 35vw"
                  loading="lazy"
                />
                <div className="media-card__content">
                  <strong>До</strong>
                </div>
              </div>
              <div className="card media-card">
                <Image
                  className="media-image"
                  src={
                    project.afterImage ??
                    project.gallery[0] ??
                    "/images/quartz-project-composition.svg"
                  }
                  alt={`${project.title} после монтажа`}
                  width={1400}
                  height={980}
                  style={{ height: 260 }}
                  sizes="(max-width: 900px) 100vw, 35vw"
                  loading="lazy"
                />
                <div className="media-card__content">
                  <strong>После</strong>
                </div>
              </div>
            </div>

            <div className="card stack">
              <h2>Комментарий клиента</h2>
              <p>{project.testimonial ?? "Отзыв будет добавлен после публикации проекта."}</p>
            </div>

            <LightboxGallery items={project.gallery} title={project.title} />
          </div>

          <div className="stack">
            <div className="card stack">
              <h2>Параметры проекта</h2>
              <p>Локация: {project.location}</p>
              <p>Категория: {project.category}</p>
              <div className="pill-list">
                {project.productRefs.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="card stack">
              <h2>Следующий шаг</h2>
              <p>Покажите свой проект, и мы подготовим точное предложение по материалу, срокам и монтажу.</p>
              <div className="btn-row">
                <Link className="button" href="/calculator">
                  Рассчитать стоимость
                </Link>
              </div>
            </div>
            <ContactForm source={`project:${project.slug}`} compact />
          </div>
        </div>
      </section>
    </>
  );
}
