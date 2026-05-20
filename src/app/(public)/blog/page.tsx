import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBlogCategories, getBlogPosts } from "@/lib/site";

const BlogListClient = dynamic(
  () => import("@/components/catalog/blog-list-client").then((m) => m.BlogListClient),
  { loading: () => <div className="card card--glass">Загрузка статей…</div> }
);

export const metadata = buildMetadata({
  title: "Блог и статьи",
  description: "Статьи по уходу за камнем, дизайну интерьера и новостям компании.",
  path: "/blog"
});

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getBlogPosts(), getBlogCategories()]);

  return (
    <>
      <PageHero
        eyebrow="Блог"
        title="SEO-статьи, которые отвечают на вопросы клиентов"
        descriptionClassName="page-hero__lead page-hero__lead--contacts"
        description="Контент распределен по категориям и связан с каталогом, услугами и портфолио для поддержки поискового продвижения."
        actions={<Link className="button-secondary" href="/catalog">Перейти в каталог</Link>}
      />

      <section className="section">
        <div className="container">
          <Suspense fallback={<div className="card card--glass">Загрузка фильтров…</div>}>
            <CatalogFilters
              fields={[
                {
                  name: "category",
                  label: "Категория",
                  options: categories.map((item) => ({ value: item.id, label: item.title }))
                }
              ]}
            />
          </Suspense>

          <BlogListClient posts={posts} categories={categories} />
        </div>
      </section>
    </>
  );
}
