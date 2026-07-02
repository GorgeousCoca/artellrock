import dynamic from "next/dynamic";
import Link from "next/link";

import { ContactsTeam } from "@/components/contacts/contacts-team";
import styles from "@/components/contacts/contacts-page.module.scss";
import { PlatformLinks } from "@/components/ui/platform-links";
import { getCompanyPhones, toTelHref } from "@/lib/company-phones";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSettings, getTeamMembers } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Контакты",
  description: "Контакты, схема проезда, форма обратной связи и реквизиты компании.",
  path: "/contacts"
});

const ContactForm = dynamic(() => import("@/components/forms/contact-form").then((m) => m.ContactForm), {
  loading: () => (
    <div className={styles.formSkeleton} role="status" aria-label="Загрузка формы" />
  )
});

export default async function ContactsPage() {
  const [settings, team] = await Promise.all([getSettings(), getTeamMembers()]);
  const phones = getCompanyPhones(settings);

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <header className={styles.pageHeader}>
          <span className="eyebrow">Контакты</span>
          <h1 className={styles.pageTitle}>Свяжитесь с нами</h1>
        </header>

        <div className={styles.layout}>
            <div className={styles.side}>
              <div>
                <h2 className={styles.blockTitle}>Контактная информация</h2>
                <div className="info-list">
                  {phones.map((phone) => (
                    <div key={phone} className="info-list__item">
                      <a href={toTelHref(phone)}>{phone}</a>
                    </div>
                  ))}
                  <div className="info-list__item">
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </div>
                  <div className="info-list__item">{settings.address}</div>
                  {settings.metro?.trim() ? (
                    <div className="info-list__item">{settings.metro}</div>
                  ) : null}
                </div>

                <div className={styles.socialBlock}>
                  <p className={styles.socialLabel}>Мы в соцсетях</p>
                  <PlatformLinks layout="grid" emphasis="prominent" />
                </div>
              </div>

              <ContactsTeam members={team} />

              {settings.mapEmbedUrl ? (
                <div className={styles.mapWrap}>
                  <iframe src={settings.mapEmbedUrl} loading="lazy" title="Карта офиса" />
                </div>
              ) : null}

              <p className={styles.faqLink}>
                На <Link href="/">главной</Link> внизу — ответы на частые вопросы о замере, сроках и
                материалах.{" "}
                <Link href="/privacy#cookies">Файлы cookie</Link>.
              </p>
            </div>

            <ContactForm source="contacts" bareSurface />
        </div>
      </div>
    </section>
  );
}
