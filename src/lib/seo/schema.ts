import type { CompanySettings, FaqItem, Product, Project } from "@/types/content";

import { faqAnswerPlainText } from "@/components/faq/render-faq-answer";
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

export function faqPageJsonLd(items: FaqItem[], pageUrl: string) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    "@id": pageUrl,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqAnswerPlainText(item.answer)
      }
    }))
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
