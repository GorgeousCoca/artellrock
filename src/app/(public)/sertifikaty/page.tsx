import { JsonLd } from "@/components/seo/json-ld";
import { CertificateCard, EmptyNote, guideStyles } from "@/components/site/guide-blocks";
import { PageHead } from "@/components/site/page-head";
import { SectionHead } from "@/components/site/section-head";
import {
  certificatesPage as page,
  hasCertificates,
  manufacturerCertificates,
  processorCertificates,
  type Certificate
} from "@/content/trust";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/schema";

const crumbs: BreadcrumbItem[] = [
  { name: "Главная", path: "/" },
  { name: page.crumb, path: page.path }
];

/** Пока нет ни одного скана, страница закрыта от поисковиков: пустую страницу индексировать не нужно. */
export const metadata = buildMetadata({
  title: page.documentTitle,
  description: page.description,
  path: page.path,
  noIndex: !hasCertificates
});

function CertificateGrid({ items }: { items: readonly Certificate[] }) {
  if (items.length === 0) return <EmptyNote>{page.empty}</EmptyNote>;
  return (
    <div className={guideStyles.grid}>
      {items.map((item) => (
        <CertificateCard key={item.image} title={item.title} issuer={item.issuer} image={item.image} alt={item.alt} />
      ))}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHead title={page.h1} lead={page.lead} crumbs={crumbs} />

      <section className="page block" aria-labelledby="cert-processor">
        <SectionHead id="cert-processor" title={page.processorTitle} lead={page.processorLead} />
        <CertificateGrid items={processorCertificates} />
      </section>

      <section className="page block" aria-labelledby="cert-manufacturer">
        <SectionHead id="cert-manufacturer" title={page.manufacturerTitle} lead={page.manufacturerLead} />
        <CertificateGrid items={manufacturerCertificates} />
      </section>
    </>
  );
}
