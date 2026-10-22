import { CalculatorWizard } from "@/components/calculator/calculator-wizard";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHead } from "@/components/site/page-head";
import { pages } from "@/content/artellrock";
import { getCalculatorCatalog } from "@/lib/calculator/server";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: "Калькулятор", path: "/kalkulyator" }
];

export const metadata = buildMetadata({
  title: "Калькулятор изделий из кварца в Петербурге — ArtellRock",
  description: pages.calculator.lead,
  path: "/kalkulyator"
});

/**
 * Небольшие справочники (кромки, бортики, мойки, услуги) читаются на сервере из Payload и передаются мастеру
 * сразу. Каталог материалов большой, поэтому грузится отдельным запросом при открытии шага 2.
 */
export default async function CalculatorPage() {
  const catalog = await getCalculatorCatalog();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={pages.calculator.title} lead={pages.calculator.lead} crumbs={crumbs} />
      <div className="page">
        <CalculatorWizard catalog={catalog} />
      </div>
    </>
  );
}
