import { redirect } from "next/navigation";

import { AdminMobileRouteGuard } from "@/components/admin/admin-mobile-route-guard";
import { AdminMobileShell } from "@/components/admin/admin-mobile-shell";
import { isAdminAuthorized } from "@/lib/admin/auth";

export default async function AdminDashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!(await isAdminAuthorized())) {
    redirect("/admin/login");
  }

  return (
    <AdminMobileShell>
      <AdminMobileRouteGuard />
      {children}
    </AdminMobileShell>
  );
}
