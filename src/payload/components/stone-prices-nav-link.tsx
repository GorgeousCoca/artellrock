"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Ссылка «Цены на камни» в боковой навигации админки (под списком коллекций). */
export function StonePricesNavLink() {
  const pathname = usePathname();
  const active = pathname === "/admin/stone-prices";

  return (
    <Link
      href="/admin/stone-prices"
      className={`nav__link${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
      prefetch={false}
    >
      {active ? <div className="nav__link-indicator" /> : null}
      <span className="nav__link-label">Цены на камни</span>
    </Link>
  );
}
