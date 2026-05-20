import type { BlogPost, CompanySettings, Product, Project } from "@/types/content";

import { absoluteUrl } from "@/lib/utils";

const SCHEMA_CONTEXT = "https://schema.org" as const;

export function organizationJsonLd(settings: CompanySettings) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#organization"),
    name: settings.companyName,
    legalName: settings.legalName,
    url: absoluteUrl("/"),
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address
    }
  };
}

export function articleJsonLd(post: BlogPost, pageUrl: string) {
  const desc = post.metaDescription ?? post.excerpt;
  const image = post.ogImage ?? post.image;
  const images = image ? [absoluteUrl(image)] : [absoluteUrl("/images/og-default.svg")];

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    "@id": pageUrl,
    headline: post.title,
    description: desc,
    datePublished: post.publishedAt,
    image: images,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    },
    author: {
      "@type": "Organization",
      name: "ArtellRock"
    },
    publisher: {
      "@type": "Organization",
      name: "ArtellRock",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/og-default.svg")
      }
    }
  };
}

export function productJsonLd(product: Product, pageUrl: string) {
  const image = product.ogImage ?? product.image;
  const imageUrl = absoluteUrl(image);

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    "@id": pageUrl,
    name: product.title,
    description: product.metaDescription ?? product.summary,
    image: [imageUrl],
    sku: product.slug,
    url: pageUrl,
    category: product.type,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "RUB",
      price: product.basePrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
}

export function creativeWorkProjectJsonLd(project: Project, pageUrl: string) {
  const images: string[] = [];
  const push = (src?: string) => {
    if (src) images.push(absoluteUrl(src));
  };
  push(project.ogImage);
  push(project.afterImage);
  push(project.beforeImage);
  project.gallery.forEach((g) => push(g));
  const unique = [...new Set(images)];

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CreativeWork",
    "@id": pageUrl,
    name: project.title,
    description: project.metaDescription ?? project.summary,
    url: pageUrl,
    image: unique.length ? unique : [absoluteUrl("/images/og-default.svg")],
    locationCreated: {
      "@type": "Place",
      name: project.location
    }
  };
}
