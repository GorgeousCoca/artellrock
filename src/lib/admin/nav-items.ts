export type AdminNavItem = {
  href: string;
  label: string;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/products", label: "Изделия" },
  { href: "/admin/stone-samples", label: "Каталог камня" },
  { href: "/admin/projects", label: "Портфолио" },
{ href: "/admin/team", label: "Команда" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/testimonials", label: "Отзывы" },
  { href: "/admin/certificates", label: "Сертификаты" },
  { href: "/admin/media", label: "Медиа" },
  { href: "/admin/settings", label: "Настройки сайта" },
  { href: "/admin/requests", label: "Заявки" }
];

export function getAdminNavLabel(pathname: string) {
  const exact = adminNavItems.find((item) => item.href === pathname);
  if (exact) {
    return exact.label;
  }

  const nested = adminNavItems.find(
    (item) => item.href !== "/admin" && pathname.startsWith(`${item.href}/`)
  );

  return nested?.label ?? "CMS";
}
