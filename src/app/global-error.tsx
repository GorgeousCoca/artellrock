"use client";

import "@/app/globals.scss";

import { AppErrorFallback } from "@/components/errors/app-error-fallback";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Ловит ошибки корневого layout. Должен сам объявить html/body: заменяет layout, пока активен.
 */
export default function GlobalError({ error: _error, reset }: GlobalErrorProps) {
  void _error;
  return (
    <html lang="ru">
      <body>
        <AppErrorFallback eyebrow="Ошибка" title="Не удалось загрузить страницу" reset={reset} />
      </body>
    </html>
  );
}
