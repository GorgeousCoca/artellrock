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
  const ogImage = image ? absoluteUrl(image) : absoluteUrl("/images/og-default.svg");
  const canonical = skipCanonical ? undefined : absoluteUrl(path);

  const openGraph: Metadata["openGraph"] = {
    type: openGraphType,
    siteName: defaultSiteName,
    locale: "ru_RU",
    title,
    description: metaDescription,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title
      }
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
