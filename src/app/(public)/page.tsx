import { HomeView } from "@/components/home/home-view";
import { JsonLd } from "@/components/seo/json-ld";
import { worksByIds } from "@/lib/portfolio";
import { faqPageJsonLd, howToJsonLd } from "@/lib/seo/schema";

/** Кадры блока 8: свои готовые изделия, без цеха, образцов и фото из блока 6. */
const INCLUDED_IDS = [
  "Avarus-Primer",
  "Avant_Quartz-04",
  "podokonnik-02",
  "Avant_Quartz-08",
  "Smart_Quartz-02",
  "Nobell_Quartz-04",
  "Avarus-06",
  "podokonnik-03",
  "Avant_Quartz-05",
  "Avarus-09",
  "Nobell_Quartz-01",
  "Avarus-04"
];

const includedWorks = worksByIds(INCLUDED_IDS);

export default function HomePage() {
  return (
    <>
      <JsonLd data={[faqPageJsonLd(), howToJsonLd("/")]} />
      <HomeView works={includedWorks} />
    </>
  );
}
