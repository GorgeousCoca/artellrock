"use client";

import "@astryxdesign/core/astryx.css";
import "@astryxdesign/core/reset.css";

import NextLink from "next/link";
import { Theme } from "@astryxdesign/core";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem, VStack } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";

import { artellrockTheme } from "@/components/astryx/artellrock-theme";
import { AVITO_URL, COMPANY_NAME, PHONE, PHONE_HREF, VK_URL, footer } from "@/content/artellrock";
import { edgesPage, materialPage, orderPage } from "@/content/guides";
import { sinksPage } from "@/content/products-extra";
import { paymentPage, promotionsPage } from "@/content/terms";
import { certificatesPage, hasCertificates, reviewsPage } from "@/content/trust";

type FooterLink = {
  href: string;
  label: string;
};

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Материалы",
    links: [
      { href: materialPage.path, label: materialPage.crumb },
      { href: edgesPage.path, label: edgesPage.crumb }
    ]
  },
  {
    title: "Изделия",
    links: [
      { href: sinksPage.path, label: sinksPage.crumb },
      { href: "/izdeliya/stupeni", label: "Ступени" },
      { href: "/izdeliya/dushevye-poddony", label: "Душевые поддоны" }
    ]
  },
  {
    title: "Покупателю",
    links: [
      { href: orderPage.path, label: orderPage.crumb },
      { href: paymentPage.path, label: paymentPage.crumb },
      { href: promotionsPage.path, label: promotionsPage.crumb },
      { href: reviewsPage.path, label: reviewsPage.crumb },
      ...(hasCertificates ? [{ href: certificatesPage.path, label: certificatesPage.crumb }] : [])
    ]
  },
  {
    title: "Документы",
    links: [
      { href: "/politika", label: footer.policy },
      { href: "/politika#cookies", label: "Файлы cookie" },
      { href: "/soglasie", label: footer.consent }
    ]
  }
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <VStack gap={3}>
        <Text weight="semibold">{title}</Text>
        <VStack gap={2}>
          {links.map((link) => (
            <Link key={link.href} as={NextLink} href={link.href} type="supporting" isStandalone>
              {link.label}
            </Link>
          ))}
        </VStack>
      </VStack>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Theme theme={artellrockTheme} mode="light">
        <VStack className="page" gap={8}>
          <HStack gap={6} hAlign="between" vAlign="start" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={2} hAlign="start">
                <NextLink className="logo" href="/" translate="no" aria-label={`${COMPANY_NAME} — на главную`}>
                  {COMPANY_NAME}
                </NextLink>
                <Text type="supporting" color="secondary" style={{ maxWidth: "36rem" }}>
                  {footer.line.replace("Санкт-Петербург", "Санкт\u2011Петербург")}
                </Text>
              </VStack>
            </StackItem>
            <VStack gap={1} hAlign="start">
              <Link href={PHONE_HREF} type="body" weight="semibold" isStandalone style={{ fontWeight: 600 }}>
                {PHONE}
              </Link>
              <Link
                href={VK_URL}
                type="supporting"
                isStandalone
                isExternalLink
                newTabLabel="откроется в новой вкладке"
              >
                ВКонтакте
              </Link>
              <Link
                href={AVITO_URL}
                type="supporting"
                isStandalone
                isExternalLink
                newTabLabel="откроется в новой вкладке"
              >
                Авито
              </Link>
            </VStack>
          </HStack>

          <Divider />

          <Grid columns={{ minWidth: 160, max: 4 }} columnGap={6} rowGap={5}>
            {columns.map((column) => (
              <FooterColumn key={column.title} title={column.title} links={column.links} />
            ))}
          </Grid>

          <Divider />

          <Text type="supporting" color="secondary">
            {footer.disclaimer}
          </Text>
        </VStack>
      </Theme>
    </footer>
  );
}
