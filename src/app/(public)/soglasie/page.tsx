import Link from "next/link";

import { LegalDocument } from "@/components/legal/legal-document";
import { PageHead } from "@/components/site/page-head";
import { consentDocument } from "@/content/legal";
import { pages } from "@/content/artellrock";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: `${pages.consent.title} — ArtellRock`,
  description:
    "Согласие на обработку имени, телефона и сообщения в заявке ArtellRock: зачем нужны данные, сколько хранятся и как отозвать согласие.",
  path: "/soglasie"
});

export default function ConsentPage() {
  return (
    <>
      <PageHead title={pages.consent.title} />
      <article className="page reading">
        <LegalDocument blocks={consentDocument} />
        <p>
          <Link href="/politika">Политика персональных данных</Link>
          {" · "}
          <Link href="/politika#cookies">Файлы cookie</Link>
        </p>
      </article>
    </>
  );
}
