import { redirect } from "next/navigation";

/** Legacy /catalog — категории живут на отдельных лендингах. */
export default function CatalogPage() {
  redirect("/catalog/countertops");
}
