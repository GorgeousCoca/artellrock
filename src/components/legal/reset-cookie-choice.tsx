"use client";

import { clearCookieConsent } from "@/lib/cookie-consent";

/** Сбрасывает выбор, чтобы плашка cookie открылась снова, и перезагружает страницу. */
export function ResetCookieChoice() {
  return (
    <p>
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => {
          clearCookieConsent();
          window.location.reload();
        }}
      >
        Изменить выбор cookie
      </button>
    </p>
  );
}
