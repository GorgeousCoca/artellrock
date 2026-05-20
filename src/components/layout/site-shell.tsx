import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { getCompanyPhones, toTelHref } from "@/lib/company-phones";
import { getSettings } from "@/lib/site";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="site-shell">
      <SiteHeader settings={settings} />
      <main className="site-main">{children}</main>
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="stack">
              <strong>{settings.companyName}</strong>
              <p>
                Изделия из искусственного камня на заказ для частных и коммерческих интерьеров в
                Санкт-Петербурге.
              </p>
            </div>
            <div className="stack">
              <strong>Разделы</strong>
              <Link href="/catalog-kamnya">Каталог камня</Link>
              <Link href="/portfolio">Портфолио</Link>
              <Link href="/blog">Блог</Link>
            </div>
            <div className="stack">
              <strong>Контакты</strong>
              {getCompanyPhones(settings).map((phone) => (
                <a key={phone} href={toTelHref(phone)}>
                  {phone}
                </a>
              ))}
              <span>{settings.email}</span>
              <span>{settings.address}</span>
              <a href="https://vk.com/club230045850?ysclid=mo5ny4mikt343003951" rel="noreferrer" target="_blank">
                Мы в VK
              </a>
              <a href="https://www.avito.ru/" rel="noreferrer" target="_blank">
                Мы на Avito
              </a>
            </div>
            <div className="stack">
              <strong>Документы</strong>
              <Link href="/privacy">Политика конфиденциальности</Link>
              <Link href="/calculator">Калькулятор</Link>
            </div>
          </div>
          <div className="site-footer-minimal">
            <span>
              © {new Date().getFullYear()} {settings.companyName}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
