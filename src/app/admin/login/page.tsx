import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthorized } from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthorized()) {
    redirect("/admin");
  }

  return (
    <div className="admin-login-wrap">
      <AdminLoginForm />
    </div>
  );
}
