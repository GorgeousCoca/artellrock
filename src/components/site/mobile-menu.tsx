"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NavLinks } from "./nav-links";

type MobileMenuProps = {
  items: readonly { href: string; label: string }[];
};

const MENU_ID = "site-mobile-menu";

export function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
      </button>

      <div id={MENU_ID} className="mobile-menu" data-open={open}>
        <NavLinks items={items} label="Меню" onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}
