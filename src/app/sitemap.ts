import type { MetadataRoute } from "next";

import { directions } from "@/content/artellrock";
import { edgesPage, materialPage, orderPage } from "@/content/guides";
import { sinksPage } from "@/content/products-extra";
import { paymentPage, promotionsPage } from "@/content/terms";
import { certificatesPage, hasCertificates, reviewsPage } from "@/content/trust";
import { listApprovedTestimonials } from "@/lib/cms/store";
import { catalogBrandSlugs, catalogStoneRoutes } from "@/lib/catalog/quartz-catalog";
import { absoluteUrl } from "@/lib/utils";

/** Карта зависит от базы (есть ли одобренные отзывы), поэтому строится на запросе, а не при сборке. */
export const dynamic = "force-dynamic";

async function hasApprovedReviews() {
  try {
    return (await listApprovedTestimonials()).length > 0;
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const showReviews = await hasApprovedReviews();
  const staticRoutes = [
    "/",
    "/izdeliya",
    "/stoimost",
    "/catalog-kvarca",
    "/kalkulyator",
    "/tseny",
    materialPage.path,
    edgesPage.path,
    orderPage.path,
    paymentPage.path,
    promotionsPage.path,
    sinksPage.path,
    ...(showReviews ? [reviewsPage.path] : []),
    ...(hasCertificates ? [certificatesPage.path] : []),
    "/portfolio",
    "/about",
    "/contacts",
    "/politika",
    "/soglasie"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.8
    })),
    ...directions.map((direction) => ({
      url: absoluteUrl(`/izdeliya/${direction.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...catalogBrandSlugs().map((brandSlug) => ({
      url: absoluteUrl(`/catalog-kvarca/${brandSlug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6
    })),
    ...catalogStoneRoutes().map((stone) => ({
      url: absoluteUrl(`/catalog-kvarca/${stone.brandSlug}/${stone.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.5
    }))
  ];
}
