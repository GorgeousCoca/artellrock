"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute("aria-hidden") !== "true" && !el.hasAttribute("disabled")
  );
}

export type UseFocusTrapOptions = {
  /** По умолчанию true — при открытии фокус на первый интерактив (модалки). Для комбобокса — false. */
  autoFocus?: boolean;
  onEscape?: () => void;
  /**
   * Если true (по умолчанию), фокус, ушедший за пределы контейнера, возвращается внутрь (модалки).
   * Для выпадающих панелей у поля ввода — false.
   */
  containFocus?: boolean;
};

/**
 * Ловушка фокуса: Tab циклически внутри контейнера, Escape (опционально), возврат фокуса при закрытии.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  options?: UseFocusTrapOptions
) {
  const autoFocus = options?.autoFocus !== false;
  const containFocus = options?.containFocus !== false;
  const onEscapeRef = useRef(options?.onEscape);

  useEffect(() => {
    onEscapeRef.current = options?.onEscape;
  }, [options?.onEscape]);

  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const moveFocusInside = () => {
      const list = focusableElements(container);
      list[0]?.focus();
    };

    const raf = autoFocus ? requestAnimationFrame(moveFocusInside) : 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscapeRef.current) {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const list = focusableElements(container);
      if (list.length === 0) {
        return;
      }

      const first = list[0];
      const last = list[list.length - 1];

      if (list.length === 1) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!containFocus) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node) || container.contains(target)) {
        return;
      }
      queueMicrotask(() => {
        const list = focusableElements(container);
        list[0]?.focus();
      });
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn, true);

    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn, true);
      returnFocusRef.current?.focus?.();
    };
  }, [active, autoFocus, containFocus, containerRef]);
}
