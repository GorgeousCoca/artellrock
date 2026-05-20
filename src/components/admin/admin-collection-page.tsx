import { AdminCollectionManager } from "@/components/admin/admin-collection-manager";
import { adminCollections, type AdminCollectionKey } from "@/lib/admin/config";
import { listCollection } from "@/lib/cms/store";

export async function AdminCollectionPage({ collection }: { collection: AdminCollectionKey }) {
  const config = adminCollections[collection];
  const items = await listCollection(collection);

  return (
    <AdminCollectionManager
      collection={collection}
      title={config.title}
      description={config.description}
      fields={config.fields}
      initialItems={items as (Record<string, unknown> & { id: string })[]}
    />
  );
}
