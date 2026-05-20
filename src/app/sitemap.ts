import type { MetadataRoute } from "next";

import { getStoneBrands } from "@/lib/stone/brands";
import { getBlogPosts, getProducts, getProjects, getStoneSamples } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, stones, projects, posts] = await Promise.all([
    getProducts(),
    getStoneSamples(),
    getProjects(),
    getBlogPosts()
  ]);
  const brands = getStoneBrands(stones);

  const staticRoutes = [
    "/",
    "/catalog",
    "/catalog-kamnya",
    "/portfolio",
    "/calculator",
    "/about",
    "/contacts",
    "/blog",
    "/privacy"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.8
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/catalog/${product.type}/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...brands.map((brand) => ({
      url: absoluteUrl(`/catalog-kamnya/brands/${brand.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/portfolio/${project.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
