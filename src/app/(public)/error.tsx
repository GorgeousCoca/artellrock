"use client";

import { useEffect } from "react";

import { AppErrorFallback } from "@/components/errors/app-error-fallback";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App route error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <AppErrorFallback
      eyebrow="Ошибка"
      title="Что-то пошло не так"
      description="Мы уже разбираемся. Обновите страницу или вернитесь на главную — так стабильнее всего."
      reset={reset}
    />
  );
}
