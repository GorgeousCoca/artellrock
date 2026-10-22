"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { METRIKA_COUNTER_ID } from "@/content/legal";
import { readCookieConsent, subscribeCookieConsent, type CookieConsent } from "@/lib/cookie-consent";

/** Счётчик подключается только после кнопки «Принять» в плашке cookie. */
export function YandexMetrika() {
  const [choice, setChoice] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const sync = () => setChoice(readCookieConsent());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  if (choice !== "analytics") return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_COUNTER_ID}', 'ym');

ym(${METRIKA_COUNTER_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
      `.trim()}
    </Script>
  );
}
