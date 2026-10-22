import { COMPANY_NAME, PHONE, PHONE_SECONDARY, VK_URL, faq, steps } from "@/content/artellrock";
import type { BrandPriceSpan } from "@/lib/catalog/quartz-match";
import { absoluteUrl } from "@/lib/utils";
import { brandHeading, brandMetaDescription } from "@/lib/seo/snippets";

const SCHEMA_CONTEXT = "https://schema.org" as const;

export function organizationJsonLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#organization"),
    name: COMPANY_NAME,
    url: absoluteUrl("/"),
    image: absoluteUrl("/images/hero-proizvodstvo.png"),
    telephone: PHONE,
    contactPoint: [PHONE, PHONE_SECONDARY].map((telephone) => ({
      "@type": "ContactPoint",
      telephone,
      contactType: "sales",
      areaServed: "RU",
      availableLanguage: "Russian"
    })),
    sameAs: [VK_URL],
    areaServed: [
      { "@type": "City", name: "Санкт-Петербург" },
      { "@type": "AdministrativeArea", name: "Ленинградская область" }
    ],
    description: "Изделия из кварцевого агломерата на заказ. Собственная мастерская."
  };
}

export function websiteJsonLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: COMPANY_NAME,
    url: absoluteUrl("/"),
    inLanguage: "ru-RU",
    publisher: { "@id": absoluteUrl("/#organization") }
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function faqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }> = faq.items,
  path = "/#voprosy"
) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    "@id": absoluteUrl(path),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };
}

/** Шаги заказа. Разметка повторяет видимый блок «Как проходит заказ». */
export function howToJsonLd(path: string) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "HowTo",
    "@id": absoluteUrl(`${path}#kak-prohodit-zakaz`),
    name: steps.title,
    description: "Заказ изделия из кварцевого агломерата в мастерской ArtellRock: от заявки до гарантии.",
    step: steps.items.map((item, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: item.title,
      text: item.text
    }))
  };
}

/** Диапазон ₽/м² бренда. Без цены разметку не отдаём: на странице тогда нет числа. */
export function brandProductJsonLd(input: {
  name: string;
  path: string;
  image?: string;
  span: BrandPriceSpan | null;
  offerCount: number;
}) {
  if (!input.span || input.offerCount < 1) return null;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    "@id": absoluteUrl(`${input.path}#product`),
    name: brandHeading(input.name),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    description: brandMetaDescription(input.name, input.span),
    brand: { "@type": "Brand", name: input.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "RUB",
      lowPrice: input.span.min,
      highPrice: input.span.max,
      offerCount: input.offerCount,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "RUB",
        unitText: "м²"
      }
    }
  };
}
