import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { adminNavItems } from "@/lib/admin/nav-items";

type AdminNavPanelProps = {
  onNavigate?: () => void;
};

export function AdminNavPanel({ onNavigate }: AdminNavPanelProps) {
  return (
    <>
      <div className="stack admin-nav-panel__intro">
        <strong>CMS</strong>
        <span className="muted">Управление контентом и SEO-полями</span>
      </div>
      <nav className="admin-nav">
        <AdminSidebarNav items={adminNavItems} onNavigate={onNavigate} />
        <AdminLogoutButton onNavigate={onNavigate} />
      </nav>
    </>
  );
}
