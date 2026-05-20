import Link from "next/link";

import { LazyImage } from "@/components/ui/lazy-image";
import { formatPrice, hasListedPricePerSqm } from "@/lib/utils";
import type { StoneSample } from "@/types/content";

import styles from "./stone-brands.module.scss";

type BrandStonesGridProps = {
  stones: StoneSample[];
};

const tones = [
  "linear-gradient(140deg, #f0f0f0, #d4d8dd)",
  "linear-gradient(140deg, #d3d6d9, #b9bdbf)",
  "linear-gradient(140deg, #dad4c6, #c2b8a3)",
  "linear-gradient(140deg, #1d1f24, #050608)",
  "linear-gradient(140deg, #efe8dc, #d2c6b7)",
  "linear-gradient(140deg, #cfd4da, #b2bbc4)"
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

function toneWithPhotoUnderlay(stone: StoneSample, index: number) {
  if (hasStonePhoto(stone)) {
    return "linear-gradient(140deg, rgba(5, 14, 13, 0.35), rgba(3, 9, 8, 0.55))";
  }
  return tone(stone, index);
}

export function BrandStonesGrid({ stones }: BrandStonesGridProps) {
  return (
    <div className={styles.swatchesGrid}>
      {stones.map((stone, index) => (
        <article
          key={stone.id}
          className={styles.swatchCard}
          style={{ background: toneWithPhotoUnderlay(stone, index) }}
        >
          {hasStonePhoto(stone) ? (
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
          <div className={styles.swatchInner}>
            <span className={styles.swatchTitle}>{stone.title}</span>
            <span className={styles.swatchMeta}>
              {hasListedPricePerSqm(stone.priceFrom)
                ? `от ${formatPrice(stone.priceFrom)} ₽/м²`
                : "от — ₽/м²"}
            </span>
            <Link className={styles.swatchAction} href="/calculator" aria-label="Перейти к калькулятору расчёта" />
          </div>
        </article>
      ))}
    </div>
  );
}
