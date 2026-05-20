"use client";

import { useEffect } from "react";

/** Блокирует прокрутку `body` пока открыта модалка или мобильное меню. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
