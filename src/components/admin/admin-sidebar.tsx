import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

const items = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/products", label: "Изделия" },
  { href: "/admin/stone-samples", label: "Каталог камня" },
  { href: "/admin/projects", label: "Портфолио" },
  { href: "/admin/blog-categories", label: "Категории блога" },
  { href: "/admin/blog-posts", label: "Статьи" },
  { href: "/admin/team", label: "Команда" },
  { href: "/admin/testimonials", label: "Отзывы" },
  { href: "/admin/certificates", label: "Сертификаты" },
  { href: "/admin/media", label: "Медиа" },
  { href: "/admin/settings", label: "Настройки сайта" },
  { href: "/admin/requests", label: "Заявки" }
];

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar stack">
      <div className="stack" style={{ gap: 6 }}>
        <strong>CMS</strong>
        <span className="muted">Управление контентом и SEO-полями</span>
      </div>
      <nav className="admin-nav">
        <AdminSidebarNav items={items} />
        <AdminLogoutButton />
      </nav>
    </aside>
  );
}
