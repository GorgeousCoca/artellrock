import Link from "next/link";

import { ConsultationProvider } from "@/components/forms/consultation-provider";
import { CookieNotice } from "@/components/legal/cookie-notice";
import { SiteHeader } from "@/components/layout/site-header";
import { getCompanyPhones, toTelHref } from "@/lib/company-phones";
import { AVITO_LISTING_URL } from "@/lib/social-links";
import { getSettings } from "@/lib/site";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const phones = getCompanyPhones(settings);

  return (
    <ConsultationProvider>
      <div className="site-shell">
        <SiteHeader settings={settings} />
        <main className="site-main">{children}</main>

        <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <strong>{settings.companyName}</strong>
              <p>
                Изделия из кварцевого агломерата на заказ. Собственное производство,
                точный замер и монтаж в Санкт-Петербурге.
              </p>
            </div>

            <nav className="site-footer__col" aria-label="Разделы сайта">
              <h4>Разделы</h4>
              <ul>
                <li><Link href="/catalog-kamnya">Каталог камня</Link></li>
                <li><Link href="/catalog/countertops">Столешницы</Link></li>
                <li><Link href="/catalog/window-sills">Подоконники</Link></li>
                <li><Link href="/portfolio">Портфолио</Link></li>
              </ul>
            </nav>

            <div className="site-footer__col">
              <h4>Контакты</h4>
              <ul>
                {phones.map((phone) => (
                  <li key={phone}>
                    <a href={toTelHref(phone)}>{phone}</a>
                  </li>
                ))}
                <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>
                <li>{settings.address}</li>
              </ul>
            </div>

            <div className="site-footer__col">
              <h4>Компания</h4>
              <ul>
                <li><Link href="/about">О нас</Link></li>
                <li><Link href="/contacts">Контакты</Link></li>
                <li>
                  <a href="https://vk.com/club230045850" rel="noreferrer" target="_blank">
                    ВКонтакте
                  </a>
                </li>
                <li>
                  <a href={AVITO_LISTING_URL} rel="noreferrer" target="_blank">
                    Авито
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="site-footer__bottom">
            <span suppressHydrationWarning>© {new Date().getFullYear()} {settings.companyName}</span>
            <div className="site-footer__legal">
              <Link href="/privacy">Политика конфиденциальности</Link>
              <Link href="/privacy#cookies">Файлы cookie</Link>
            </div>
          </div>
        </div>
      </footer>

        <CookieNotice />
    </div>
    </ConsultationProvider>
  );
}
