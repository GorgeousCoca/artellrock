import type { CSSProperties } from "react";
import Image from "next/image";

import { getBrandIconBySlug } from "@/lib/stone/brand-icons";
import type { BrandPageCopy } from "@/lib/stone/brand-page-copy";

import styles from "./stone-brands.module.scss";

type BrandPageHeroProps = {
  slug: string;
  copy: BrandPageCopy;
};

export function BrandPageHero({ slug, copy }: BrandPageHeroProps) {
  const brandIcon = getBrandIconBySlug(slug);

  return (
    <section className={styles.brandMarbleHero} aria-labelledby="brand-page-hero-title">
      <div className={`container ${styles.brandMarbleHeroContent}`}>
        <div className={styles.brandMarbleHeroTop}>
          <div className={styles.brandMarbleHeroTitles}>
            <p className={styles.brandMarbleHeroCategory}>Кварцевый агломерат</p>
            <h1 id="brand-page-hero-title" className={styles.brandMarbleHeroName}>
              {copy.headlineName}
            </h1>
          </div>
          {brandIcon ? (
            <div className={styles.brandMarbleHeroLogo}>
              <Image
                src={brandIcon.iconSrc}
                alt=""
                width={280}
                height={96}
                className={styles.brandMarbleHeroLogoImg}
                style={
                  brandIcon.iconScale
                    ? ({ "--brand-icon-scale": brandIcon.iconScale } as CSSProperties)
                    : undefined
                }
                sizes="(max-width: 900px) 50vw, 280px"
                priority
              />
            </div>
          ) : null}
        </div>
        <div className={styles.brandMarbleHeroCopy}>
          {copy.paragraphs.map((paragraph, index) => (
            <p key={index} className={styles.brandMarbleHeroParagraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
