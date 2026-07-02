"use client";

import { useConsultation } from "@/components/forms/consultation-provider";
import { LazyImage } from "@/components/ui/lazy-image";
import { formatPrice, hasListedPricePerSqm } from "@/lib/utils";
import type { StoneSample } from "@/types/content";

import styles from "./stone-brands.module.scss";

type BrandStonesGridProps = {
  stones: StoneSample[];
};

const tones = [
  "linear-gradient(140deg, #ede9e2, #d8d0c4)",
  "linear-gradient(140deg, #d6d1ca, #bfb9b0)",
  "linear-gradient(140deg, #dad4c8, #c4bcaf)",
  "linear-gradient(140deg, #e8e3db, #d2c9bc)",
  "linear-gradient(140deg, #cfd4da, #b8bec6)",
  "linear-gradient(140deg, #dbd8d2, #c8c3bb)"
];

function hasStonePhoto(stone: StoneSample) {
  return Boolean(stone.image && !stone.image.includes("quartz-surface-light.svg"));
}

function tone(stone: StoneSample, index: number) {
  if (stone.title?.toLowerCase().includes("black") || stone.color?.toLowerCase().includes("чер")) {
    return "linear-gradient(140deg, #1b1d22, #030406)";
  }
  return tones[index % tones.length];
}

function SwatchAction({ stoneId, title }: { stoneId: string; title: string }) {
  const { openConsultation } = useConsultation();

  return (
    <button
      type="button"
      className={styles.swatchAction}
      onClick={() => openConsultation(`brand-swatch:${stoneId}`)}
      aria-label={`Запросить консультацию по декору ${title}`}
    />
  );
}

export function BrandStonesGrid({ stones }: BrandStonesGridProps) {
  return (
    <div className={styles.swatchesGrid}>
      {stones.map((stone, index) => {
        const hasPhoto = hasStonePhoto(stone);
        return (
          <article
            key={stone.id}
            className={styles.swatchCard}
            style={{ background: hasPhoto ? "transparent" : tone(stone, index) }}
          >
            {hasPhoto ? (
              <div className={styles.swatchPhoto} aria-hidden>
                <LazyImage
                  src={stone.image}
                  alt=""
                  fill
                  sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw"
                  quality={75}
                  priority={index < 6}
                />
              </div>
            ) : null}
            <div className={hasPhoto ? styles.swatchInner : styles.swatchInnerFlat}>
              <span className={styles.swatchTitle}>{stone.title}</span>
              <span className={styles.swatchMeta}>
                {hasListedPricePerSqm(stone.priceFrom)
                  ? `от ${formatPrice(stone.priceFrom)} ₽/м²`
                  : "от — ₽/м²"}
              </span>
              <SwatchAction stoneId={stone.id} title={stone.title} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
