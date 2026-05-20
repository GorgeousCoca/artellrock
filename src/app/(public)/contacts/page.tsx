import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PageHero } from "@/components/ui/content";
import { getCompanyPhones, toTelHref } from "@/lib/company-phones";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSettings } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Контакты",
  description: "Контакты, схема проезда, форма обратной связи и реквизиты компании.",
  path: "/contacts"
});

const contactSocialLinks = {
  vk: "https://vk.com/club230045850?ysclid=mo5ny4mikt343003951",
  avito: "https://www.avito.ru/"
} as const;

const ContactForm = dynamic(() => import("@/components/forms/contact-form").then((m) => m.ContactForm), {
  loading: () => (
    <div
      className="card card--glass"
      style={{ minHeight: 300 }}
      role="status"
      aria-label="Загрузка формы"
    />
  )
});

const ContactMessageDraft = dynamic(() =>
  import("@/components/forms/contact-message-draft").then((m) => m.ContactMessageDraft)
);

export default async function ContactsPage() {
  const settings = await getSettings();
  const phones = getCompanyPhones(settings);

  return (
    <>
      <PageHero
        eyebrow="Контакты"
        title="Свяжитесь с нами удобным способом"
        titleClassName="catalog-category-hero-title"
        descriptionClassName="page-hero__lead page-hero__lead--contacts"
        actionsClassName="contacts-hero-actions"
        visualImageSrc="/images/Avarus-Primer.jpg"
        visualImageAlt="Контактная страница ArtellRock"
        visualBadgeText="Контакты. Замер. Монтаж."
        description="Оставьте заявку через форму, позвоните напрямую или приезжайте по адресу производства и офиса."
        actions={
          <>
            <div className="contacts-hero-phones">
              {phones.map((phone) => (
                <a key={phone} className="button contacts-hero-phone" href={toTelHref(phone)}>
                  Позвонить {phone}
                </a>
              ))}
            </div>
            <div className="contacts-hero-bottom">
              <div className="contacts-hero-social">
                <a
                  className="button contacts-hero-social-link"
                  href={contactSocialLinks.avito}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Image
                    className="contacts-social-link__icon"
                    src="/images/avito-logo.svg"
                    alt=""
                    width={22}
                    height={22}
                  />
                  Авито
                </a>
                <a
                  className="button contacts-hero-social-link"
                  href={contactSocialLinks.vk}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Image
                    className="contacts-social-link__icon"
                    src="/images/vk-logo.svg"
                    alt=""
                    width={22}
                    height={22}
                  />
                  ВК
                </a>
              </div>
              <Link className="button-secondary contacts-hero-calc" href="/calculator">
                Быстрый расчет
              </Link>
            </div>
          </>
        }
      />
      <div className="contacts-page">
        <section className="section">
          <div className="container grid grid-2">
            <div className="card card--glass stack">
              <h2>Контактная информация</h2>
              <div className="info-list">
                {phones.map((phone) => (
                  <div key={phone} className="info-list__item">
                    <a href={toTelHref(phone)}>{phone}</a>
                  </div>
                ))}
                <div className="info-list__item">{settings.email}</div>
                <div className="info-list__item">{settings.address}</div>
                {settings.metro?.trim() ? <div className="info-list__item">{settings.metro}</div> : null}
              </div>
              <div className="map-wrap">
                <iframe src={settings.mapEmbedUrl} loading="lazy" title="Карта офиса" />
              </div>
            </div>

            <div className="stack">
              <Suspense fallback={null}>
                <ContactMessageDraft />
              </Suspense>
              <ContactForm source="contacts" className="card--glass" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
