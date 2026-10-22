"use client";

import "@astryxdesign/core/astryx.css";
import "@astryxdesign/core/reset.css";

import type { CSSProperties } from "react";
import { Theme } from "@astryxdesign/core";
import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";

import { artellrockTheme } from "@/components/astryx/artellrock-theme";
import { FactStrip } from "@/components/home/fact-strip";
import { Hero } from "@/components/home/hero";
import { Photo } from "@/components/site/photo";
import { LeadForm } from "@/components/site/lead-form";
import {
  PHONE,
  PHONE_HREF,
  VK_URL,
  contactPanel,
  directions,
  faq,
  featuredProject,
  included,
  leadForm,
  reasons,
  steps,
  vk
} from "@/content/artellrock";
import { portfolioCaptions } from "@/content/portfolio-captions";
import type { Work } from "@/content/works";

const mediaStyle: CSSProperties = {
  borderRadius: "var(--radius-container)",
  overflow: "clip",
  background: "var(--color-background-muted)"
};

const CATALOGS = [
  {
    title: "Каталог изделий",
    href: "/izdeliya",
    image: "/images/portfolio/case-island-light.jpg",
    alt: "Светлый кухонный остров из кварца",
    line: "Столешницы, фартуки, стойки и подоконники."
  },
  {
    title: "Каталог камня",
    href: "/catalog-kvarca",
    image: "/images/stones/primax/pq702-primax-quartz-702-light-calacatta/texture.jpg",
    alt: "Светлый кварцевый агломерат с серыми прожилками",
    line: "Декоры и цена за квадратный метр."
  },
  {
    title: "Каталог моек",
    href: "/moyki-iz-kvarca",
    image: "/images/portfolio/case-sink-double.jpg",
    alt: "Столешница из кварца с мойкой",
    line: "Чаши из того же кварца, что и столешница."
  },
  {
    title: "Каталог профилей",
    href: "/kromki",
    image: "/images/portfolio/case-edge-narrow.jpg",
    alt: "Профиль кромки столешницы из кварца",
    line: "Кромки и бортики, в том числе фигурные."
  }
] as const;

function SectionIntro({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <VStack gap={2}>
      <Heading id={id} level={2}>
        {title}
      </Heading>
      {lead ? (
        <Text type="body" color="secondary">
          {lead}
        </Text>
      ) : null}
    </VStack>
  );
}

function MediaCard({
  href,
  title,
  line,
  image,
  alt,
  sizes
}: {
  href: string;
  title: string;
  line: string;
  image: string;
  alt: string;
  sizes: string;
}) {
  return (
    <ClickableCard href={href} label={title} padding={0} variant="transparent">
      <VStack gap={3}>
        <Card padding={0}>
          <AspectRatio ratio={4 / 3} style={mediaStyle}>
            <Photo src={image} alt={alt} sizes={sizes} />
          </AspectRatio>
        </Card>
        <VStack gap={1}>
          <Heading level={3}>{title}</Heading>
          <Text type="body" color="secondary">
            {line}
          </Text>
        </VStack>
      </VStack>
    </ClickableCard>
  );
}

function CatalogSection() {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="catalogs-title">
      <VStack gap={6}>
        <SectionIntro
          id="catalogs-title"
          title="Каталоги"
          lead="Изделия, декоры камня, мойки и профили кромок. Выбирайте и считайте стоимость в калькуляторе."
        />
        <Grid columns={{ minWidth: 240, max: 4 }} gap={6}>
          {CATALOGS.map((item) => (
            <MediaCard
              key={item.href}
              {...item}
              sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 25vw"
            />
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function LeadBlock() {
  return (
    <Section id="zayavka" variant="transparent" padding={0} aria-labelledby="lead-title">
      <Grid columns={{ minWidth: 320 }} align="start" gap={10}>
        <VStack gap={4}>
          <VStack gap={3}>
            <Heading id="lead-title" level={2}>
              {leadForm.title}
            </Heading>
            <Text type="body" color="secondary">
              {leadForm.lead}
            </Text>
          </VStack>
          <Grid columns={{ minWidth: 180 }} gap={3}>
            {leadForm.proofs.map((proof) => (
              <Card key={proof} variant="muted" padding={3}>
                <Text type="supporting">{proof}</Text>
              </Card>
            ))}
          </Grid>
        </VStack>
        <Card padding={6}>
          <LeadForm source="home-lead" idPrefix="lead" />
        </Card>
      </Grid>
    </Section>
  );
}

function DirectionsSection() {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="directions-title">
      <VStack gap={6}>
        <SectionIntro
          id="directions-title"
          title="Изделия из кварца"
          lead="Кварцевый агломерат — плита, из которой делаем столешницы, фартуки, барные стойки и подоконники на заказ."
        />
        <Grid columns={{ minWidth: 280, max: 3 }} gap={6}>
          {directions.map((direction) => (
            <MediaCard
              key={direction.slug}
              href={`/izdeliya/${direction.slug}`}
              title={direction.title}
              line={direction.line}
              image={direction.image}
              alt={direction.imageAlt}
              sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw"
            />
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function FeaturedSection() {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="featured-title">
      <Grid columns={{ minWidth: 360, repeat: "fit" }} gap={8} align="center">
        <VStack gap={4}>
          <Heading id="featured-title" level={2}>
            {featuredProject.title}
          </Heading>
          <Text type="body" color="secondary">
            {featuredProject.text}
          </Text>
          <Link href={featuredProject.linkHref} isStandalone>
            {featuredProject.link}
          </Link>
        </VStack>
        <Grid columns={{ minWidth: 160, max: 3 }} gap={3}>
          {featuredProject.images.map((image) => (
            <AspectRatio key={image.src} ratio={1} style={mediaStyle}>
              <Photo src={image.src} alt={image.alt} sizes="(max-width: 700px) 100vw, 20vw" />
            </AspectRatio>
          ))}
        </Grid>
      </Grid>
    </Section>
  );
}

function ReasonsSection() {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="reasons-title">
      <VStack gap={6}>
        <SectionIntro id="reasons-title" title={reasons.title} />
        <Grid columns={{ minWidth: 280, max: 3 }} gap={4}>
          {reasons.items.map((item) => (
            <Card key={item.title} variant="muted" padding={4}>
              <VStack gap={2}>
                <Heading level={3}>{item.title}</Heading>
                <Text type="body" color="secondary">
                  {item.text}
                </Text>
              </VStack>
            </Card>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function StepsSection() {
  return (
    <Section id="kak-prohodit-zakaz" variant="transparent" padding={0} aria-labelledby="steps-title">
      <VStack gap={6}>
        <SectionIntro id="steps-title" title={steps.title} />
        <Grid columns={{ minWidth: 200, max: 5 }} gap={4}>
          {steps.items.map((item, index) => (
            <Card key={item.title} variant="muted" padding={4}>
              <VStack gap={2}>
                <Text type="label" color="secondary">
                  {index + 1}
                </Text>
                <Heading level={3}>{item.title}</Heading>
                <Text type="supporting" color="secondary">
                  {item.text}
                </Text>
              </VStack>
            </Card>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function withCaption(work: Work): Work {
  if (work.text?.trim()) return work;
  const caption = portfolioCaptions[work.id];
  if (!caption) return work;
  const titleIsLabel = !work.title || work.title === caption.label;
  return {
    ...work,
    title: titleIsLabel ? caption.title : work.title,
    text: caption.text
  };
}

function WorksSection({ works }: { works: Work[] }) {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="included-title">
      <VStack gap={6}>
        <SectionIntro id="included-title" title={included.title} />
        <Grid columns={{ minWidth: 280, max: 3 }} columnGap={5} rowGap={8}>
          {works.map((item) => {
            const work = withCaption(item);
            const title = work.title ?? work.label;
            return (
              <VStack key={work.id} gap={2}>
                <AspectRatio ratio={3 / 2} style={mediaStyle}>
                  <Photo
                    src={work.image}
                    alt={title}
                    sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw"
                  />
                </AspectRatio>
                <Heading level={3}>{title}</Heading>
                {work.text ? (
                  <Text type="supporting" color="secondary">
                    {work.text}
                  </Text>
                ) : null}
              </VStack>
            );
          })}
        </Grid>
      </VStack>
    </Section>
  );
}

function FaqBlock() {
  const half = Math.ceil(faq.items.length / 2);
  const columns = [faq.items.slice(0, half), faq.items.slice(half)];

  return (
    <Section variant="transparent" padding={0} aria-labelledby="voprosy-title">
      <VStack gap={6}>
        <SectionIntro id="voprosy-title" title={faq.title} />
        <Grid columns={{ minWidth: 320 }} gap={8}>
          {columns.map((column) => (
            <CollapsibleGroup key={column[0]?.question} type="single" hasDividers>
              {column.map((item) => (
                <Collapsible
                  key={item.question}
                  value={item.question}
                  trigger={
                    <Text type="body" weight="semibold">
                      {item.question}
                    </Text>
                  }
                >
                  <Text type="body" color="secondary">
                    {item.answer}
                  </Text>
                </Collapsible>
              ))}
            </CollapsibleGroup>
          ))}
        </Grid>
      </VStack>
    </Section>
  );
}

function VkSection() {
  return (
    <Section variant="muted" padding={6} aria-labelledby="vk-title">
      <HStack gap={6} hAlign="between" vAlign="center" wrap="wrap">
        <VStack gap={2}>
          <Heading id="vk-title" level={2}>
            {vk.title}
          </Heading>
          <Text type="body" color="secondary">
            {vk.text}
          </Text>
        </VStack>
        <a className="btn btn--primary" href={VK_URL} target="_blank" rel="noreferrer noopener">
          {vk.button}
        </a>
      </HStack>
    </Section>
  );
}

function ContactSection() {
  return (
    <Section variant="transparent" padding={0} aria-labelledby="panel-title">
      <Grid columns={{ minWidth: 320 }} align="start" gap={10}>
        <VStack gap={4}>
          <Text type="label" color="secondary">
            {contactPanel.eyebrow}
          </Text>
          <Heading id="panel-title" level={2}>
            {contactPanel.title}
          </Heading>
          <Text type="body" color="secondary">
            {contactPanel.lead}
          </Text>
          <HStack gap={4} vAlign="center" wrap="wrap">
            <a className="btn btn--primary" href={PHONE_HREF}>
              {PHONE}
            </a>
            <Link href={VK_URL} isStandalone isExternalLink newTabLabel="откроется в новой вкладке">
              {contactPanel.vkLink}
            </Link>
          </HStack>
        </VStack>
        <Card padding={6}>
          <LeadForm source="contact-panel" idPrefix="panel" />
        </Card>
      </Grid>
    </Section>
  );
}

export function HomeView({ works }: { works: Work[] }) {
  return (
    <>
      <Hero />
      <FactStrip />
      <Theme theme={artellrockTheme} mode="light">
      <VStack className="page home-view" gap={10}>
        <CatalogSection />
        <LeadBlock />
        <DirectionsSection />
        <FeaturedSection />
        <ReasonsSection />
        <StepsSection />
        <WorksSection works={works} />
        <FaqBlock />
        <VkSection />
        <ContactSection />
      </VStack>
      </Theme>
    </>
  );
}
