import { AdminCollectionManager } from "@/components/admin/admin-collection-manager";
import { adminCollections } from "@/lib/admin/config";
import { listCollection } from "@/lib/cms/store";

export default async function AdminStoneSamplesPage() {
  const config = adminCollections.stoneSamples;
  const items = await listCollection("stoneSamples");

  return (
    <AdminCollectionManager
      collection="stoneSamples"
      title={config.title}
      description={config.description}
      fields={config.fields}
      initialItems={items as (Record<string, unknown> & { id: string })[]}
    />
  );
}
