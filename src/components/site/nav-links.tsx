"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

type NavLinksProps = {
  items: readonly NavItem[];
  label: string;
  className?: string;
  onNavigate?: () => void;
};

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items, label, className, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
