"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { useConsultation } from "@/components/forms/consultation-provider";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import type { CompanySettings } from "@/types/content";

const catalogDropdown = [
  { href: "/catalog/countertops", label: "Столешницы" },
  { href: "/catalog/window-sills", label: "Подоконники" },
  { href: "/catalog/sinks", label: "Другие изделия" },
  { href: "/catalog-kamnya", label: "Кварцевый агломерат" }
];

const navItems = [
  { href: "/portfolio", label: "Портфолио" },
  { href: "/contacts", label: "Контакты" }
];

const MOBILE_NAV_ID = "site-mobile-nav";
const CONSULTATION_CTA = "Получить консультацию";

export function SiteHeader({ settings }: { settings: CompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const { openConsultation } = useConsultation();

  useFocusTrap(isOpen, mobileNavRef, {
    autoFocus: false,
    onEscape: () => setIsOpen(false)
  });
  useScrollLock(isOpen);

  const close = () => setIsOpen(false);

  const isNavActive = (href: string) => {
    if (pathname === href) {
      return true;
    }
    if (href === "/catalog-kamnya") {
      return pathname.startsWith("/catalog-kamnya");
    }
    if (href.startsWith("/catalog")) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return false;
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__inner">
          <Link className="site-brand" href="/" onClick={close}>
            <strong className="site-brand__title">{settings.companyName}</strong>
          </Link>

          <nav className="site-nav" aria-label="Основная навигация">
            <div className="nav-item">
              <button type="button" className="nav-item__trigger" aria-haspopup="true" aria-expanded={false}>
                Каталог
                <ChevronDown size={14} aria-hidden />
              </button>
              <div className="nav-dropdown" role="menu">
                {catalogDropdown.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={isNavActive(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isNavActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              className="button"
              onClick={() => openConsultation("header")}
            >
              {CONSULTATION_CTA}
            </button>
          </nav>

          <button
            className="button-secondary mobile-nav-toggle"
            onClick={() => setIsOpen((v) => !v)}
            type="button"
            aria-expanded={isOpen}
            aria-controls={isOpen ? MOBILE_NAV_ID : undefined}
            aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>

        {isOpen ? (
          <div
            ref={mobileNavRef}
            className="mobile-nav"
            id={MOBILE_NAV_ID}
            role="navigation"
            aria-label="Мобильное меню"
          >
            <button
              type="button"
              className="button mobile-nav__cta"
              onClick={() => {
                openConsultation("header-mobile");
                close();
              }}
            >
              {CONSULTATION_CTA}
            </button>
            <p className="mobile-nav__label">Каталог изделий</p>
            {catalogDropdown.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-nav__link"
                onClick={close}
                aria-current={isNavActive(item.href) ? "page" : undefined}
              >
                <span>{item.label}</span>
                <ChevronRight size={16} className="mobile-nav__chevron" aria-hidden />
              </Link>
            ))}
            <p className="mobile-nav__label">Сайт</p>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-nav__link"
                onClick={close}
                aria-current={isNavActive(item.href) ? "page" : undefined}
              >
                <span>{item.label}</span>
                <ChevronRight size={16} className="mobile-nav__chevron" aria-hidden />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
