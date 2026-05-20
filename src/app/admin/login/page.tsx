import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthorized } from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthorized()) {
    redirect("/admin");
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <AdminLoginForm />
      </div>
    </section>
  );
}
