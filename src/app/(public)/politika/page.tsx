import { LegalDocument } from "@/components/legal/legal-document";
import { ResetCookieChoice } from "@/components/legal/reset-cookie-choice";
import { PageHead } from "@/components/site/page-head";
import { privacyDocument } from "@/content/legal";
import { pages } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: `${pages.policy.title} — ArtellRock`,
  description:
    "Какие данные собирает ArtellRock в заявке и когда включается Яндекс.Метрика. Раздел о файлах cookie и локальном хранилище.",
  path: "/politika"
});

export default function PolicyPage() {
  return (
    <>
      <PageHead title={pages.policy.title} />
      <article className="page reading">
        <LegalDocument blocks={privacyDocument} />
        <ResetCookieChoice />
      </article>
    </>
  );
}
