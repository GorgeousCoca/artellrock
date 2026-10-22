/** Выбор посетителя: статистика Яндекс.Метрики или только необходимые данные. */
export const COOKIE_CONSENT_KEY = "cookie_consent";

export const COOKIE_CONSENT_EVENT = "artellrock-cookie-consent";

export type CookieConsent = "analytics" | "necessary";

export function readCookieConsent(): CookieConsent | null {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === "analytics" || value === "necessary") return value;
    return null;
  } catch {
    return null;
  }
}

export function subscribeCookieConsent(onChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeCookieConsent(value: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function clearCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
