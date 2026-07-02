"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useState } from "react";

import styles from "./cookie-notice.module.scss";

const STORAGE_KEY = "cookie_notice_dismissed";

function readDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Informational cookie notice for public pages.
 * Future analytics: extend with a CookieConsentProvider and opt-in categories (Phase 6 D-06).
 */
export function CookieNotice() {
  const pathname = usePathname();
  const [clientDismissed, setClientDismissed] = useState(false);

  const storageDismissed = useSyncExternalStore(
    () => () => {},
    readDismissed,
    // Server: assume dismissed so returning visitors don't see a flash before hydration.
    () => true
  );

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
    setClientDismissed(true);
  };

  if (pathname.startsWith("/admin") || storageDismissed || clientDismissed) {
    return null;
  }

  return (
    <div className={styles.bar} role="region" aria-label="Уведомление о файлах cookie">
      <div className={`container ${styles.inner}`}>
        <p className={styles.text}>
          Для статистики посещений используется Яндекс.Метрика. Маркетинговые cookie не
          применяются. Сохраняется только настройка закрытия этого уведомления.{" "}
          <Link className={styles.link} href="/privacy#cookies">
            Подробнее
          </Link>
        </p>
        <button type="button" className={`button ${styles.button}`} onClick={dismiss}>
          Понятно
        </button>
      </div>
    </div>
  );
}
