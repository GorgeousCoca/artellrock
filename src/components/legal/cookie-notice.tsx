"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { readCookieConsent, subscribeCookieConsent, writeCookieConsent, type CookieConsent } from "@/lib/cookie-consent";

import styles from "./cookie-notice.module.scss";

export function CookieNotice() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<CookieConsent | null | "pending">("pending");

  useEffect(() => {
    const sync = () => setChoice(readCookieConsent());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      document.body.style.paddingBottom = "";
      return;
    }

    const apply = () => {
      document.body.style.paddingBottom = `${bar.offsetHeight}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, [choice, pathname]);

  if (pathname.startsWith("/admin") || choice !== null) return null;

  return (
    <div ref={barRef} className={styles.bar} role="region" aria-label="Уведомление о файлах cookie">
      <div className={styles.inner}>
        <p className={styles.text}>
          Сайт запоминает ваш выбор. Статистика Яндекс.Метрики включается только после согласия. Маркетинговые cookie
          не используются.{" "}
          <Link href="/politika#cookies">Подробнее</Link>
        </p>
        <div className={styles.actions}>
          <button type="button" className={`btn btn--primary ${styles.button}`} onClick={() => writeCookieConsent("analytics")}>
            Принять
          </button>
          <button type="button" className={`btn btn--secondary ${styles.button}`} onClick={() => writeCookieConsent("necessary")}>
            Только необходимые
          </button>
        </div>
      </div>
    </div>
  );
}
