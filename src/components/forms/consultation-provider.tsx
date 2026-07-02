"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ConsultationModal } from "@/components/forms/consultation-modal";

type ConsultationContextValue = {
  openConsultation: (source?: string) => void;
  closeConsultation: () => void;
};

const ConsultationContext = createContext<ConsultationContextValue | null>(null);

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("header");

  const openConsultation = useCallback((nextSource = "header") => {
    setSource(nextSource);
    setOpen(true);
  }, []);

  const closeConsultation = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openConsultation, closeConsultation }),
    [openConsultation, closeConsultation]
  );

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      <ConsultationModal open={open} source={source} onClose={closeConsultation} />
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error("useConsultation must be used within ConsultationProvider");
  }
  return context;
}
