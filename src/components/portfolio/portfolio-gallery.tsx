"use client";

import { useState } from "react";
import Link from "next/link";
import { Theme } from "@astryxdesign/core";
import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Heading, Text } from "@astryxdesign/core/Text";

import { Photo } from "@/components/site/photo";
import type { Work } from "@/lib/portfolio";

import { artellrockTheme } from "@/components/astryx/artellrock-theme";

export type PortfolioGroupView = {
  label: string;
  items: Work[];
};

const mediaStyle = {
  borderRadius: "var(--radius-container)",
  overflow: "clip",
  background: "var(--color-background-muted)"
} as const;

function WorkTile({ work, ratio, priority }: { work: Work; ratio: number; priority?: boolean }) {
  const title = work.title ?? work.label;

  return (
    <VStack gap={2}>
      <AspectRatio ratio={ratio} fit="cover" style={mediaStyle}>
        <Photo
          src={work.image}
          alt={title}
          sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw"
          priority={priority}
        />
      </AspectRatio>
      <VStack gap={1.5}>
        <Heading level={3}>{title}</Heading>
        {work.text ? (
          <Text type="supporting" color="secondary">
            {work.text}
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
}

function WorkGroup({ group, lead }: { group: PortfolioGroupView; lead: boolean }) {
  const headingId = `works-${group.label}`;

  return (
    <Section variant="transparent" padding={0} aria-labelledby={headingId}>
      <VStack gap={5}>
        <Heading id={headingId} level={2}>
          {group.label}
        </Heading>
        <Grid columns={{ minWidth: 280, max: 3 }} columnGap={5} rowGap={8}>
          {group.items.map((work, index) => (
            <WorkTile key={work.id} work={work} ratio={3 / 2} priority={lead && index === 0} />
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

export function PortfolioGallery({ groups }: { groups: PortfolioGroupView[] }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? groups : groups.filter((group) => group.label === filter);

  return (
    <Theme theme={artellrockTheme} mode="light">
      <VStack gap={10}>
        <TabList value={filter} onChange={setFilter} hasDivider overflow="scroll" aria-label="Разделы портфолио">
          <Tab value="all" label="Все" />
          {groups.map((group) => (
            <Tab key={group.label} value={group.label} label={group.label} />
          ))}
        </TabList>

        {visible.map((group, index) => (
          <WorkGroup key={group.label} group={group} lead={index === 0} />
        ))}

        <Section variant="transparent" padding={0} aria-labelledby="works-next">
          <VStack gap={3}>
            <Heading id="works-next" level={2}>
              Заказать похожее изделие
            </Heading>
            <Text color="secondary">
              Посчитайте предварительную сумму в калькуляторе или оставьте заявку на бесплатный замер.
            </Text>
            <HStack gap={2} wrap="wrap" vAlign="center">
              <Link className="btn btn--primary" href="/kalkulyator">
                Калькулятор
              </Link>
              <Link className="btn btn--secondary" href="/#zayavka">
                Оставить заявку
              </Link>
            </HStack>
          </VStack>
        </Section>
      </VStack>
    </Theme>
  );
}
