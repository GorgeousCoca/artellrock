"use client";

import type { ReactNode } from "react";

import { useConsultation } from "@/components/forms/consultation-provider";

type ConsultationButtonProps = {
  source: string;
  children: ReactNode;
  className?: string;
};

export function ConsultationButton({
  source,
  children,
  className = "button"
}: ConsultationButtonProps) {
  const { openConsultation } = useConsultation();

  return (
    <button type="button" className={className} onClick={() => openConsultation(source)}>
      {children}
    </button>
  );
}
