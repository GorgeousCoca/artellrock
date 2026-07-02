import { PageTracker } from "@/components/analytics/page-tracker";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { SiteShell } from "@/components/layout/site-shell";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteShell>
      <YandexMetrika />
      <PageTracker />
      {children}
    </SiteShell>
  );
}
