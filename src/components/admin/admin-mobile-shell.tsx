import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminNavPanel } from "@/components/admin/admin-nav-panel";

type AdminMobileShellProps = {
  children: React.ReactNode;
};

export function AdminMobileShell({ children }: AdminMobileShellProps) {
  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar admin-sidebar--desktop">
          <AdminNavPanel />
        </aside>

        <header className="admin-mobile-header">
          <div className="admin-mobile-header__titles">
            <strong>CMS</strong>
            <span className="muted">Обзор</span>
          </div>
          <AdminLogoutButton />
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
