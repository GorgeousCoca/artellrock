import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHead } from "@/components/site/page-head";
import { pages } from "@/content/artellrock";
import { formatRub } from "@/lib/calculator/format";
import { getCalculatorCatalog, getMaterials } from "@/lib/calculator/server";
import { SINK_TYPES } from "@/lib/calculator/taxonomy";
import { texturePriceRows } from "@/lib/prices/texture-groups";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: "Цены", path: "/tseny" }
];

export const metadata = buildMetadata({
  title: pages.prices.documentTitle,
  description: pages.prices.description,
  path: "/tseny"
});

function formatSpan(min: number, max: number, unit: string) {
  if (min === max) return `${formatRub(min)} / ${unit}`;
  return `от ${formatRub(min)} до ${formatRub(max)} / ${unit}`;
}

function formatUnitPrice(price: number, unit: string) {
  if (price <= 0) return "Входит в стоимость";
  return `${formatRub(price)} / ${unit}`;
}

export default async function PricesPage() {
  const [materials, catalog] = await Promise.all([getMaterials(), getCalculatorCatalog()]);
  const textureRows = texturePriceRows(materials);
  const priced = materials.map((material) => material.pricePerSqm).filter((price) => price > 0);
  const materialSpan = priced.length > 0 ? { min: Math.min(...priced), max: Math.max(...priced) } : null;
  const thicknesses = catalog.edges.filter((edge) => edge.kind === "thickness");
  const profiles = catalog.edges.filter((edge) => edge.kind === "profile");
  const sinkGroups = SINK_TYPES.map((type) => ({
    ...type,
    items: catalog.sinks.filter((sink) => sink.type === type.value)
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={pages.prices.title} lead={pages.prices.lead} crumbs={crumbs} />
      <div className="page price-sheet">
        {materialSpan ? (
          <section aria-labelledby="price-material">
            <h2 id="price-material">Стоимость материала</h2>
            <p className="price-sheet__note">
              Кварцевый агломерат в каталоге — {formatSpan(materialSpan.min, materialSpan.max, "м²")}. В таблице —
              диапазон по фактуре. Цена выбранного декора указана на его странице.
            </p>
            {textureRows.length > 0 ? (
              <div className="price-sheet__scroll">
                <table className="price-table">
                  <thead>
                    <tr>
                      <th scope="col">Фактура</th>
                      <th scope="col">Стоимость материала</th>
                    </tr>
                  </thead>
                  <tbody>
                    {textureRows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.title}</th>
                        <td>{formatSpan(row.min, row.max, "м²")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <p>
              <Link href="/catalog-kvarca">Каталог кварца</Link>
            </p>
          </section>
        ) : null}

        {thicknesses.length > 0 ? (
          <PriceRows
            id="price-thickness"
            title="Толщина кромки"
            unit="м.п."
            rows={thicknesses.map((edge) => ({ id: edge.id, name: edge.name, price: edge.pricePerMeter }))}
          />
        ) : null}

        {profiles.length > 0 ? (
          <PriceRows
            id="price-profile"
            title="Профиль кромки"
            unit="м.п."
            rows={profiles.map((edge) => ({ id: edge.id, name: edge.name, price: edge.pricePerMeter }))}
          />
        ) : null}

        {catalog.backsplashes.length > 0 ? (
          <PriceRows
            id="price-backsplash"
            title="Бортик"
            unit="м.п."
            rows={catalog.backsplashes.map((item) => ({ id: item.id, name: item.name, price: item.pricePerMeter }))}
          />
        ) : null}

        {sinkGroups.map((group) => (
          <PriceRows
            key={group.value}
            id={`price-sink-${group.value}`}
            title={group.label}
            unit="шт"
            rows={group.items.map((sink) => ({ id: sink.id, name: sink.name, price: sink.price }))}
          />
        ))}

        <section className="price-sheet__next" aria-label="Дальше">
          <p>Замер бесплатный. Итоговая цена изделия — после замера по Санкт-Петербургу и Ленинградской области.</p>
          <div className="price-sheet__actions">
            <Link className="btn btn--primary" href="/kalkulyator">
              Калькулятор
            </Link>
            <Link className="btn btn--secondary" href="/stoimost">
              Узнать стоимость
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function PriceRows({
  id,
  title,
  unit,
  rows
}: {
  id: string;
  title: string;
  unit: string;
  rows: { id: string; name: string; price: number }[];
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div className="price-sheet__scroll">
        <table className="price-table">
          <thead>
            <tr>
              <th scope="col">Название</th>
              <th scope="col">Цена</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.name}</th>
                <td>{formatUnitPrice(row.price, unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
