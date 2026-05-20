"use client";

import { useSearchParams } from "next/navigation";

export function ContactMessageDraft() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  if (!message) {
    return null;
  }

  return (
    <div className="card card--glass stack">
      <span className="eyebrow">Черновик из калькулятора</span>
      <p>{message}</p>
    </div>
  );
}
