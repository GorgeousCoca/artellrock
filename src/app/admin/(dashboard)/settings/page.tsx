import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { getSettings } from "@/lib/site";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return <AdminSettingsForm initialSettings={settings} />;
}
