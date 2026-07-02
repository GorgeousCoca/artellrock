"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  catalog: "Каталог",
  "catalog-kamnya": "Каталог камня",
  countertops: "Столешницы",
  "window-sills": "Подоконники",
  brands: "Бренды",
  portfolio: "Портфолио",
  about: "О компании",
  contacts: "Контакты",
  faq: "Вопросы и ответы",
  "thank-you": "Спасибо за обращение",
  privacy: "Политика конфиденциальности",
  admin: "Админка",
  login: "Вход"
};

function prettify(segment: string) {
  return labelMap[segment] ?? segment.replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);

  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        {parts.map((part, index) => {
          const href = `/${parts.slice(0, index + 1).join("/")}`;
          const isLast = index === parts.length - 1;

          return (
            <span key={href}>
              {" / "}{isLast ? <span>{prettify(part)}</span> : <Link href={href}>{prettify(part)}</Link>}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
