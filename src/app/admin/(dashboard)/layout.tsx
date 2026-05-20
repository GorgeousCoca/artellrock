import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
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
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}
