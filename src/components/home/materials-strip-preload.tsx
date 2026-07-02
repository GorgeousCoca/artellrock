"use client";

import { useEffect } from "react";

type MaterialsStripPreloadProps = {
  urls: string[];
};

/** Прогрев кэша браузера до появления плиток в анимации marquee */
export function MaterialsStripPreload({ urls }: MaterialsStripPreloadProps) {
  useEffect(() => {
    const unique = [...new Set(urls)];

    unique.forEach((src) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [urls]);

  return null;
}
