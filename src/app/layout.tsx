import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/app/globals.scss";
import { buildMetadata } from "@/lib/seo/metadata";
import { getMetadataBaseUrl } from "@/lib/utils";

import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd } from "@/lib/seo/schema";
import { getSettings } from "@/lib/site";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
  adjustFontFallback: true,
  preload: true
});

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  ...buildMetadata({
    title: "ArtellRock — изделия из кварцевого агломерата на заказ",
    description:
      "Столешницы, подоконники, мойки и коммерческие поверхности из кварцевого агломерата под заказ в Санкт-Петербурге и Ленинградской области.",
    path: "/"
  })
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <html lang="ru" className={inter.variable}>
      <body className={inter.className}>
        <JsonLd data={organizationJsonLd(settings)} />
        {children}
      </body>
    </html>
  );
}
