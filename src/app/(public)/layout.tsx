import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteShell>
      <Breadcrumbs />
      {children}
    </SiteShell>
  );
}
