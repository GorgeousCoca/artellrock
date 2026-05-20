"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { getCompanyPhones } from "@/lib/company-phones";
import type { CompanySettings } from "@/types/content";

const navItems = [
  { href: "/catalog-kamnya", label: "Каталог камня" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/about", label: "О компании" },
  { href: "/contacts", label: "Контакты" }
];

const MOBILE_NAV_ID = "site-mobile-nav";

export function SiteHeader({ settings }: { settings: CompanySettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isStoneCatalogTheme = pathname.startsWith("/catalog-kamnya");
  const phones = getCompanyPhones(settings);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);

  useFocusTrap(isOpen, mobileNavRef, {
    autoFocus: false,
    onEscape: () => setIsOpen(false)
  });
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = requestAnimationFrame(() => {
      firstMobileLinkRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    const body = document.body;
    if (!body) {
      // В нестандартных средах (например, тестовый JSDOM без body) classList даст ошибку в консоли.
      return;
    }
    if (isStoneCatalogTheme) {
      body.classList.add("catalog-emerald-theme");
    } else {
      body.classList.remove("catalog-emerald-theme");
    }

    return () => {
      body.classList.remove("catalog-emerald-theme");
    };
  }, [isStoneCatalogTheme, pathname]);

  return (
    <header className={`site-header ${isStoneCatalogTheme ? "site-header--emerald" : ""}`.trim()}>
      <div className="container">
        <div className="site-header__inner">
          <Link className="site-brand" href="/">
            <strong>{settings.companyName}</strong>
            <span className="muted site-brand__phones">
              {phones.map((phone) => (
                <span key={phone}>{phone}</span>
              ))}
            </span>
          </Link>

          <nav className="site-nav" aria-label="Основная навигация">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="button" href="/calculator">
              {settings.primaryCta}
            </Link>
          </nav>

          <button
            className="button-secondary mobile-nav-toggle"
            onClick={() => setIsOpen((value) => !value)}
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
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link className="button" href="/calculator" onClick={() => setIsOpen(false)}>
              {settings.primaryCta}
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
