import type { Metadata } from "next";

import { absoluteUrl, excerptText } from "@/lib/utils";

const defaultSiteName = "ArtellRock";

type MetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  /** Не задавать canonical и og:url (например, для глобальной 404). */
  skipCanonical?: boolean;
  openGraphType?: "website" | "article";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
  };
};

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex,
  skipCanonical,
  openGraphType = "website",
  article
}: MetaInput): Metadata {
  const metaDescription = excerptText(description, 160);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl("/images/hero-proizvodstvo.png");
  const canonical = skipCanonical ? undefined : absoluteUrl(path);

  const openGraph: Metadata["openGraph"] = {
    type: openGraphType,
    siteName: defaultSiteName,
    locale: "ru_RU",
    title,
    description: metaDescription,
    images: [
      image
        ? { url: ogImage, alt: title }
        : { url: ogImage, alt: title, width: 841, height: 726 }
    ],
    ...(!skipCanonical && canonical ? { url: canonical } : {}),
    ...(openGraphType === "article" && article
      ? {
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime
        }
      : {})
  };

  return {
    title,
    description: metaDescription,
    alternates: skipCanonical ? undefined : { canonical },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: [ogImage]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
}
