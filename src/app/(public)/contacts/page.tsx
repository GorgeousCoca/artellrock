import { PageHead } from "@/components/site/page-head";
import { LeadForm } from "@/components/site/lead-form";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ADDRESS,
  PHONE,
  PHONE_HREF,
  PHONE_SECONDARY,
  PHONE_SECONDARY_HREF,
  VK_URL,
  leadForm,
  pages
} from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: pages.contacts.title, path: "/contacts" }
];

export const metadata = buildMetadata({
  title: "Контакты ArtellRock — Санкт-Петербург и область",
  description: pages.contacts.description,
  path: "/contacts"
});

export default function ContactsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={pages.contacts.title} lead={pages.contacts.lead} crumbs={crumbs} />
      <div className="page contacts-grid">
        <section className="contacts-card" aria-label={pages.contacts.title}>
          <dl>
            <dt>Телефон</dt>
            <dd>
              <a href={PHONE_HREF}>{PHONE}</a>
            </dd>
            <dt>Телефон</dt>
            <dd>
              <a href={PHONE_SECONDARY_HREF}>{PHONE_SECONDARY}</a>
            </dd>
            <dt>ВКонтакте</dt>
            <dd>
              <a href={VK_URL} target="_blank" rel="noreferrer noopener">
                {VK_URL.replace("https://", "")}
              </a>
            </dd>
            <dt>Регион</dt>
            <dd>{pages.contacts.region}</dd>
            <dt>Мастерская</dt>
            <dd>{ADDRESS}</dd>
          </dl>
          <p style={{ marginTop: 24 }}>{pages.contacts.visit}</p>
        </section>

        <section id="zayavka" className="contacts-card" aria-labelledby="contacts-form-title">
          <h2 id="contacts-form-title" className="t-display-md">
            {leadForm.title}
          </h2>
          <p style={{ margin: "8px 0 24px" }}>{leadForm.lead}</p>
          <LeadForm source="contacts" idPrefix="contacts" />
        </section>
      </div>
    </>
  );
}
