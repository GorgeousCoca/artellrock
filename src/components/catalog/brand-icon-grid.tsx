import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BRAND_ICON_ENTRIES } from "@/lib/stone/brand-icons";
import { brandCatalogHref } from "@/lib/stone/brands";

import styles from "./stone-brands.module.scss";

export function BrandIconGrid() {
  return (
    <nav className={styles.brandIconGrid} aria-label="Выбор бренда кварцевого агломерата">
      {BRAND_ICON_ENTRIES.map((entry) => (
        <Link
          key={entry.slug}
          href={brandCatalogHref(entry.slug)}
          className={styles.brandIconButton}
          aria-label={`${entry.name} — каталог декоров`}
        >
          <span className={styles.brandIconButtonVisual}>
            <Image
              src={entry.iconSrc}
              alt=""
              width={180}
              height={56}
              className={styles.brandIconImage}
              style={
                entry.iconScale
                  ? ({ "--brand-icon-scale": entry.iconScale } as CSSProperties)
                  : undefined
              }
              sizes="(max-width: 639px) 120px, 160px"
              loading="eager"
            />
          </span>
          <span className={styles.brandIconMobileMeta}>
            <span className={styles.brandIconMobileName}>{entry.name}</span>
            <span className={styles.brandIconMobileAction} aria-hidden>
              Каталог
              <ChevronRight size={18} strokeWidth={2.25} />
            </span>
          </span>
          <span className={styles.brandIconHoverLabel} aria-hidden>
            Подробнее
            <ChevronRight size={16} strokeWidth={2.25} />
          </span>
        </Link>
      ))}
    </nav>
  );
}
