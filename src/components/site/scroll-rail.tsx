"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ScrollRailProps = {
  /** Название ленты для скринридера. */
  label: string;
  /** Модификаторы раскладки: rail--thirds, rail--slides, rail--grid и т.д. */
  className?: string;
  children: React.ReactNode;
};

/**
 * Горизонтальная лента со снапом. Раскладку (сетка на десктопе, лента на планшете,
 * слайды галереи) задаёт класс родителя, сам компонент отвечает за прокрутку и кнопки.
 */
export function ScrollRail({ label, className = "", children }: ScrollRailProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  function scrollByPage(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + 16 : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: reduced ? "auto" : "smooth" });
  }

  const hasOverflow = canPrev || canNext;

  return (
    <div className={`rail ${className}`}>
      <div className="rail__controls" data-overflow={hasOverflow}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Назад"
          disabled={!canPrev}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Вперёд"
          disabled={!canNext}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
      <div ref={trackRef} className="rail__track" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
