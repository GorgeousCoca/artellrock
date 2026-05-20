"use client";

import { X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { LazyImage } from "@/components/ui/lazy-image";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useScrollLock } from "@/hooks/use-scroll-lock";

export function LightboxGallery({
  items,
  title
}: {
  items: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const safeActiveIndex =
    activeIndex !== null && items.length > 0 ? Math.min(activeIndex, items.length - 1) : null;
  const isOpen = safeActiveIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);

  useFocusTrap(isOpen, dialogRef, {
    autoFocus: true,
    onEscape: close
  });
  useScrollLock(isOpen);

  return (
    <>
      <div className="grid grid-3">
        {items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            className="card media-card lightbox-thumb"
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-haspopup="dialog"
            aria-label={`Открыть фото ${index + 1} из ${items.length} в полноэкранном просмотре`}
          >
            <span className="lightbox-thumb__frame">
              <LazyImage
                src={item}
                alt=""
                fill
                className="lightbox-thumb__img"
                sizes="(max-width: 900px) 100vw, 33vw"
                quality={75}
                priority={index < 3}
              />
            </span>
            <div className="media-card__content">
              <strong>{title}</strong>
              <p>Фото проекта {index + 1}</p>
            </div>
          </button>
        ))}
      </div>

      {isOpen ? (
        <div
          ref={dialogRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div className="lightbox__content card stack" onClick={(event) => event.stopPropagation()}>
            <div className="btn-row" style={{ justifyContent: "space-between" }}>
              <strong id={titleId}>{title}</strong>
              <button className="button-secondary" type="button" onClick={close} aria-label="Закрыть просмотр">
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="lightbox__stage">
              <LazyImage
                src={items[safeActiveIndex]!}
                alt={`${title} — фото ${safeActiveIndex + 1} из ${items.length}`}
                width={1200}
                height={800}
                className="lightbox__stage-img"
                sizes="(max-width: 900px) 100vw, min(900px, 85vw)"
                quality={90}
                priority
              />
            </div>
            <p className="muted">
              Изображение {safeActiveIndex + 1} из {items.length}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
