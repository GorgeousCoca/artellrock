import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/seo/schema";

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav className="crumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path}>
              {last ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
