import type { Metadata } from "next";

import "@/app/globals.scss";
import { PageTracker } from "@/components/analytics/page-tracker";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteShell } from "@/components/site/site-shell";
import { seo } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/schema";
import { getMetadataBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  ...buildMetadata({
    title: seo.title,
    description: seo.description,
    path: "/"
  })
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <SiteShell>
          <YandexMetrika />
          <PageTracker />
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
