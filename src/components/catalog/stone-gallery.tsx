"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { Photo } from "@/components/site/photo";

import styles from "./stone-detail.module.scss";

type StoneGalleryProps = {
  images: string[];
  name: string;
};

/** Большое фото и лента миниатюр. Стрелки, клавиши и свайп листают снимки. */
export function StoneGallery({ images, name }: StoneGalleryProps) {
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const current = images[Math.min(index, images.length - 1)] ?? images[0];
  const several = images.length > 1;

  useEffect(() => {
    const list = thumbsRef.current;
    const active = list?.querySelector<HTMLElement>("[aria-current='true']");
    if (!list || !active) return;
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const overflowLeft = listRect.left - activeRect.left;
    const overflowRight = activeRect.right - listRect.right;
    if (overflowLeft > 0) list.scrollLeft -= overflowLeft + 8;
    else if (overflowRight > 0) list.scrollLeft += overflowRight + 8;
  }, [index]);

  function go(next: number) {
    setIndex(Math.max(0, Math.min(images.length - 1, next)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  return (
    <div className={styles.gallery} onKeyDown={onKeyDown}>
      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div className={styles.frame}>
          <Photo
            src={current}
            alt={`${name}, фото ${index + 1} из ${images.length}`}
            sizes="(max-width: 800px) 100vw, 55vw"
            priority={index === 0}
          />
        </div>
        {index > 0 ? (
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => go(index - 1)}>
            <Chevron direction="left" />
            <span>Предыдущее фото</span>
          </button>
        ) : null}
        {index < images.length - 1 ? (
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => go(index + 1)}>
            <Chevron direction="right" />
            <span>Следующее фото</span>
          </button>
        ) : null}
      </div>

      {several ? (
        <ul className={styles.thumbs} ref={thumbsRef} aria-label="Все фотографии">
          {images.map((image, itemIndex) => (
            <li key={`${image}-${itemIndex}`}>
              <button
                type="button"
                className={styles.thumb}
                aria-current={itemIndex === index ? "true" : undefined}
                aria-label={`Фото ${itemIndex + 1}`}
                onClick={() => setIndex(itemIndex)}
              >
                <Photo src={image} alt="" sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="visually-hidden" aria-live="polite">
        Фото {index + 1} из {images.length}
      </p>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d={direction === "left" ? "M11 4 L6 9 L11 14" : "M7 4 L12 9 L7 14"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
