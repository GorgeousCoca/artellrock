import { AboutCards, AboutFacts, AboutIntro } from "@/components/about/about-blocks";
import { LeadSection } from "@/components/home/lead-section";
import { JsonLd } from "@/components/seo/json-ld";
import { InnerSteps } from "@/components/site/inner-layout";
import { PageHead } from "@/components/site/page-head";
import { ReasonsDark } from "@/components/site/reasons-dark";
import { aboutCards, aboutFacts, aboutPage } from "@/content/about";
import { pages } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, howToJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.about.title, path: "/about" }
];

export const metadata = buildMetadata({
  title: "О компании — мастерская кварца в Петербурге — ArtellRock",
  description: pages.about.description,
  path: "/about"
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), howToJsonLd("/about")]} />
      <PageHead title={aboutPage.h1} crumbs={crumbs} align="center" />
      <AboutIntro paragraphs={pages.about.paragraphs} />
      <AboutCards cards={aboutCards()} />
      <AboutFacts title={aboutPage.factsTitle} facts={aboutFacts()} />
      <div className="page">
        <ReasonsDark />
      </div>
      <InnerSteps />
      <div className="block">
        <LeadSection source="about" />
      </div>
    </>
  );
}