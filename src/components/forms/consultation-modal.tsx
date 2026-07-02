"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { ContactForm } from "@/components/forms/contact-form";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useScrollLock } from "@/hooks/use-scroll-lock";

import styles from "./consultation-modal.module.scss";

type ConsultationModalProps = {
  open: boolean;
  source: string;
  onClose: () => void;
};

export function ConsultationModal({ open, source, onClose }: ConsultationModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useScrollLock(open);
  useFocusTrap(open, dialogRef, { onEscape: onClose });

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          <X size={20} aria-hidden />
        </button>
        <h2 id="consultation-modal-title" className={styles.title}>
          Получить консультацию
        </h2>
        <p className={styles.lead}>Оставьте контакты — перезвоним и ответим на вопросы по материалу и монтажу.</p>
        <ContactForm source={source} variant="callback" onSuccess={onClose} />
      </div>
    </div>
  );
}
