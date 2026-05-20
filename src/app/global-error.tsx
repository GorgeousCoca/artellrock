"use client";

import { Inter } from "next/font/google";

import "@/app/globals.scss";

import { AppErrorFallback } from "@/components/errors/app-error-fallback";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
  adjustFontFallback: true,
  preload: false
});

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Catches errors in the root layout (including `RootLayout` itself).
 * Must define html/body — it replaces the root layout when active.
 */
export default function GlobalError({ error: _error, reset }: GlobalErrorProps) {
  void _error;
  return (
    <html lang="ru" className={inter.variable}>
      <body className={inter.className} style={{ margin: 0 }}>
        <AppErrorFallback
          eyebrow="Критическая ошибка"
          title="Не удалось загрузить страницу"
          description="Проблема на стороне приложения. Попробуйте снова или зайдите позже."
          reset={reset}
        />
      </body>
    </html>
  );
}
