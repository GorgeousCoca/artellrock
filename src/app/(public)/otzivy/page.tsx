import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { EmptyNote, ReviewCard, guideStyles } from "@/components/site/guide-blocks";
import { PageHead } from "@/components/site/page-head";
import { Pagination } from "@/components/site/pagination";
import { ReviewForm } from "@/components/site/review-form";
import { ReviewFormLayout } from "@/components/site/review-sources";
import { SectionHead } from "@/components/site/section-head";
import { reviewsPage as page } from "@/content/trust";
import { leadForm } from "@/content/artellrock";
import { listApprovedTestimonials } from "@/lib/cms/store";
import { pageCountFor, paginate, parsePageParam } from "@/lib/pagination";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: page.crumb, path: page.path }
];

/** Пока одобренных отзывов нет, страница закрыта от поисковиков: пустую страницу индексировать не нужно. */
type PageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const PAGE_SIZE = 9;
const LIST_ANCHOR = "reviews-page-top";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const reviews = await listApprovedTestimonials();
  const current = Math.min(parsePageParam((await searchParams).page), pageCountFor(reviews.length, PAGE_SIZE));
  return buildMetadata({
    title: current > 1 ? `${page.documentTitle} — страница ${current}` : page.documentTitle,
    description: page.description,
    path: current > 1 ? `${page.path}?page=${current}` : page.path,
    noIndex: reviews.length === 0
  });
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const reviews = await listApprovedTestimonials();
  const slice = paginate(reviews, parsePageParam((await searchParams).page), PAGE_SIZE);
  // Страницы за последней не существуют: отдаём 404, а не дубль последней.
  if (slice.page > slice.pageCount) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} align="center" />

      <section id={LIST_ANCHOR} className="page block" style={{ scrollMarginTop: 96 }} aria-labelledby="reviews-list">
        <h2 id="reviews-list" className="visually-hidden">
          Отзывы
        </h2>
        {reviews.length > 0 ? (
          <>
            <div className={guideStyles.grid}>
              {slice.items.map((review) => (
                <ReviewCard key={review.id} author={review.author} role={review.role} quote={review.quote} rating={review.rating} date={review.createdAt} />
              ))}
            </div>
            <Pagination page={slice.page} pageCount={slice.pageCount} basePath={page.path} anchor={LIST_ANCHOR} label="Страницы отзывов" />
          </>
        ) : (
          <EmptyNote>{page.empty}</EmptyNote>
        )}
      </section>

      <section className="page block" aria-labelledby="reviews-form">
        <SectionHead id="reviews-form" title={page.formTitle} lead={page.formLead} align="center" />
        <ReviewFormLayout>
          <ReviewForm />
        </ReviewFormLayout>
      </section>

      <section className="page block" aria-labelledby="reviews-order">
        <SectionHead id="reviews-order" title="Заказать изделие" lead={leadForm.lead} align="center" />
        <div className={`${guideStyles.actions} ${guideStyles.actionsCenter}`}>
          <Link className="btn btn--primary" href="/#zayavka">
            Оставить заявку
          </Link>
          <Link className="btn btn--secondary" href="/kalkulyator">
            Калькулятор
          </Link>
        </div>
      </section>
    </>
  );
}
