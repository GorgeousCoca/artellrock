import { CostCatalog } from "@/components/catalog/cost-catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ADDRESS, EMAIL, MAP_EMBED_URL, PHONES, pages } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.cost.title, path: "/stoimost" }
];

export const metadata = buildMetadata({
  title: pages.cost.documentTitle,
  description: pages.cost.description,
  path: "/stoimost"
});

export default function CostPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <header className="page page-head cost-head">
        <Breadcrumbs items={crumbs} />
        <h1 className="t-display-lg">{pages.cost.title}</h1>
      </header>
      <div className="page">
        <CostCatalog />
      </div>
      <section className="cost-map" aria-label="Контактная информация">
        <iframe
          className="cost-map__frame"
          src={MAP_EMBED_URL}
          title="Мастерская ArtellRock на карте"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="cost-map__card">
          <h2>Контактная информация</h2>
          <p className="cost-map__label">Консультация и расчёт</p>
          {PHONES.map((phone) => (
            <p key={phone.href}>
              <a href={phone.href}>{phone.label}</a>
            </p>
          ))}
          <p>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p className="cost-map__label">Мастерская</p>
          <p>{ADDRESS}</p>
          <p>{pages.contacts.visit}</p>
        </div>
      </section>
    </>
  );
}
