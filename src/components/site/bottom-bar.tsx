"use client";

import { usePathname } from "next/navigation";

import { PHONE_HREF, VK_URL, bottomBar } from "@/content/artellrock";

/** Страницы со своей формой заявки (#zayavka). На остальных «Заявка» ведёт на форму главной. */
const FORM_PAGES = [
  "/",
  "/contacts",
  "/about",
  "/akcii",
  "/kak-zakazat",
  "/oplata-i-dostavka",
  "/kvartsevyy-aglomerat",
  "/kromki",
  "/moyki-iz-kvarca"
] as const;

function pageHasForm(pathname: string) {
  return FORM_PAGES.includes(pathname as (typeof FORM_PAGES)[number]) || pathname.startsWith("/izdeliya/");
}

/** Видна только на экранах до 570px (правило в globals.scss). */
export function BottomBar() {
  const pathname = usePathname();
  const requestHref = pageHasForm(pathname) ? "#zayavka" : "/#zayavka";

  return (
    <nav className="bottom-bar" aria-label="Быстрые действия">
      <a href={PHONE_HREF}>{bottomBar.call}</a>
      <a href={VK_URL} target="_blank" rel="noreferrer noopener">
        {bottomBar.vk}
      </a>
      <a className="is-primary" href={requestHref}>
        {bottomBar.request}
      </a>
    </nav>
  );
}
