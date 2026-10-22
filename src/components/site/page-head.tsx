import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo/schema";

type PageHeadProps = {
  title: string;
  lead?: string;
  back?: { href: string; label: string };
  crumbs?: readonly BreadcrumbItem[];
  /** Заголовок и вводный текст по центру. */
  align?: "center";
};

/** Заголовок внутренней страницы: крошки или возврат к разделу, h1 и вводный абзац. */
export function PageHead({ title, lead, back, crumbs, align }: PageHeadProps) {
  return (
    <header className={align === "center" ? "page page-head page-head--center" : "page page-head"}>
      {crumbs && crumbs.length > 0 ? (
        <Breadcrumbs items={crumbs} />
      ) : back ? (
        <Link className="back-link" href={back.href}>
          ← {back.label}
        </Link>
      ) : null}
      <h1 className="t-display-lg">{title}</h1>
      {lead ? <p className="t-lead-airy">{lead}</p> : null}
    </header>
  );
}
