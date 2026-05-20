"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LazyImage } from "@/components/ui/lazy-image";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { formatPrice, hasListedPricePerSqm } from "@/lib/utils";
import { manufacturerToSlug, type StoneBrand } from "@/lib/stone/brands";
import type { StoneSample } from "@/types/content";

import styles from "./stone-brands.module.scss";

type StoneBrandsClientProps = {
  stones: StoneSample[];
  brands: StoneBrand[];
};

const BRAND_SEARCH_DEBOUNCE_MS = 300;

const swatchBackgrounds = [
  "linear-gradient(140deg, #0f2c27, #051310)",
  "linear-gradient(140deg, #11322c, #071913)",
  "linear-gradient(140deg, #0e2924, #04110f)",
  "linear-gradient(140deg, #1b1d22, #050608)",
  "linear-gradient(140deg, #143730, #071b17)",
  "linear-gradient(140deg, #0b2420, #040f0d)"
];

function hasStonePhoto(stone: StoneSample) {
  return Boolean(stone.image && !stone.image.includes("quartz-surface-light.svg"));
}

/** Фон карточки без фото — градиент или заглушка. При реальном фото текстура через `<LazyImage fill />`. */
function cardTone(stone: StoneSample, index: number) {
  const titleLower = stone.title?.toLowerCase() ?? "";
  const colorLower = stone.color?.toLowerCase() ?? "";
  const finishLower = stone.finish?.toLowerCase() ?? "";
  if (titleLower.includes("black") || colorLower.includes("чер")) {
    return "linear-gradient(140deg, #1b1d22, #030406)";
  }
  if (finishLower.includes("мат") || colorLower.includes("white")) {
    return "linear-gradient(140deg, #22413b, #0b211d)";
  }
  return swatchBackgrounds[index % swatchBackgrounds.length];
}

function cardToneWithPhotoUnderlay(stone: StoneSample, index: number) {
  if (hasStonePhoto(stone)) {
    return "linear-gradient(140deg, rgba(5, 14, 13, 0.35), rgba(3, 9, 8, 0.55))";
  }
  return cardTone(stone, index);
}

function BrandSwatches({ stones }: { stones: StoneSample[] }) {
  return (
    <>
      <div className={styles.stonesHead}>
        <strong>Материалы выбранного бренда</strong>
        <span>{stones.length} позиций</span>
      </div>

      <div className={styles.swatchesGrid}>
        {stones.map((stone, index) => (
          <article
            key={stone.id}
            className={styles.swatchCard}
            style={{ background: cardToneWithPhotoUnderlay(stone, index) }}
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
    </>
  );
}

export function StoneBrandsClient({ stones, brands }: StoneBrandsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeBrand = searchParams.get("brand");
  const [brandQuery, setBrandQuery] = useState("");
  const [debouncedBrandQuery, setDebouncedBrandQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const brandComboRef = useRef<HTMLDivElement | null>(null);
  const brandInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedBrandQuery(brandQuery), BRAND_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [brandQuery]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!brandComboRef.current) return;
      const target = event.target;
      // target бывает null (редко); contains ожидает Node — иначе возможна ошибка при всплытии события.
      if (!target || !(target instanceof Node)) return;
      if (!brandComboRef.current.contains(target)) {
        setIsBrandMenuOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function applyBrandFilter(nextBrand: string | null) {
    if ((nextBrand ?? null) === (activeBrand ?? null)) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    if (nextBrand) {
      next.set("brand", nextBrand);
    } else {
      next.delete("brand");
    }
    const query = next.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  const visibleBrands = useMemo(() => {
    const query = debouncedBrandQuery.trim().toLowerCase();
    if (!query) {
      return brands;
    }
    return brands.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [debouncedBrandQuery, brands]);
  const hintedBrands = visibleBrands.slice(0, 10);

  const filtered = useMemo(() => {
    if (!activeBrand) {
      return [];
    }
    return stones.filter((stone) => manufacturerToSlug(stone.manufacturer) === activeBrand);
  }, [activeBrand, stones]);

  const totalBrands = brands.length;
  const visibleBrandsCount = visibleBrands.length;
  const activeBrandMeta = brands.find((brand) => brand.slug === activeBrand);
  const showBrandMenu = isBrandMenuOpen && (brandQuery.trim().length > 0 || !activeBrand);
  const comboboxHelpId = "brand-combobox-help";
  const comboboxListId = "brand-combobox-list";
  const brandInputId = useId();
  const trapBrandMenu = showBrandMenu && visibleBrands.length > 0;

  useFocusTrap(trapBrandMenu, brandComboRef, {
    autoFocus: false,
    containFocus: false,
    onEscape: () => setIsBrandMenuOpen(false)
  });

  function pickBrand(brand: StoneBrand | null) {
    if (brand) {
      setBrandQuery(brand.name);
      applyBrandFilter(brand.slug);
    } else {
      setBrandQuery("");
      applyBrandFilter(null);
    }
    setIsBrandMenuOpen(false);
    window.setTimeout(() => brandInputRef.current?.focus(), 0);
  }

  return (
    <section className={styles.catalogSurface}>
      <div className={styles.brandFilterRow}>
        <div className={`card ${styles.brandFilterCard}`}>
          <div className={styles.unifiedHead}>
            <span className="eyebrow">Каталог кварца по брендам</span>
            <h1>Кварцевый агломерат - каталог цветов</h1>
            <p>
              Выберите бренд через поиск или селект. Ниже появятся декоры с ценами; по клику — переход к
              калькулятору расчёта стоимости.
            </p>
          </div>

          <div className={styles.filterGrid}>
            <div className="stack" ref={brandComboRef}>
              <label className={styles.brandFieldLabel} htmlFor={brandInputId}>
                Бренд
              </label>
              <div className={styles.brandCombo}>
                <input
                  ref={brandInputRef}
                  id={brandInputId}
                  className={`field ${styles.brandComboInput}`}
                  placeholder="Начните вводить: Caesarstone, Avant, Belenco…"
                  value={brandQuery}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showBrandMenu}
                  aria-controls={comboboxListId}
                  aria-describedby={comboboxHelpId}
                  onFocus={() => setIsBrandMenuOpen(true)}
                  onChange={(event) => {
                    setBrandQuery(event.target.value);
                    setIsBrandMenuOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsBrandMenuOpen(false);
                      return;
                    }
                    if (event.key === "Enter") {
                      const first = visibleBrands[0];
                      if (first) {
                        pickBrand(first);
                      }
                    }
                  }}
                />
                {activeBrand ? (
                  <button
                    type="button"
                    className={styles.brandComboClear}
                    onClick={() => pickBrand(null)}
                    aria-label="Сбросить выбранный бренд"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <span id={comboboxHelpId} className={styles.fieldHint}>
                {activeBrandMeta
                  ? `Выбран бренд: ${activeBrandMeta.name}${
                      typeof activeBrandMeta.count === "number" ? ` — ${activeBrandMeta.count} декоров` : ""
                    }.`
                  : "Введите название и выберите бренд из списка — ниже появятся материалы."}
              </span>

              {showBrandMenu ? (
                <div className={styles.brandMenu} id={comboboxListId} role="listbox">
                  {visibleBrands.length ? (
                    visibleBrands.map((brand) => (
                    <button
                      key={brand.slug}
                      type="button"
                      role="option"
                      aria-selected={brand.slug === activeBrand}
                      className={`${styles.brandMenuItem} ${brand.slug === activeBrand ? styles.brandMenuItemActive : ""}`}
                      onClick={() => pickBrand(brand)}
                    >
                        <span className={styles.brandMenuName}>{brand.name}</span>
                        <span className={styles.brandMenuCount}>{brand.count}</span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.brandMenuEmpty}>Ничего не найдено. Проверьте написание.</div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.filterStatusRow} aria-live="polite">
            <span className={styles.filterStatus}>
              {brandQuery
                ? `Найдено брендов: ${visibleBrandsCount} из ${totalBrands}`
                : `Всего брендов в каталоге: ${totalBrands}`}
            </span>
          </div>

          <div className={styles.hintsArea}>
            {brandQuery ? (
              <div className={styles.hintsWrap}>
                {hintedBrands.length ? (
                  hintedBrands.map((brand) => (
                    <button
                      key={brand.slug}
                      className={styles.hintChip}
                      type="button"
                      onClick={() => {
                        pickBrand(brand);
                      }}
                    >
                      {brand.name}
                      <span className={styles.brandCount}>{brand.count}</span>
                    </button>
                  ))
                ) : (
                  <span className={styles.emptyHint}>Ничего не найдено. Уточните название бренда.</span>
                )}
              </div>
            ) : (
              <span className={styles.hintsPlaceholder} aria-hidden="true" />
            )}
          </div>

          <div className={styles.filterActionRow}>
            <button
              className={`button-ghost ${styles.resetButton} ${activeBrand ? "" : styles.resetButtonHidden}`}
              type="button"
              onClick={() => pickBrand(null)}
              disabled={!activeBrand}
              aria-hidden={!activeBrand}
            >
              Сбросить бренд
            </button>
            {isPending ? <span className={styles.pendingText}>Обновляем список...</span> : null}
          </div>
        </div>
      </div>

      <div className={styles.benefitsGrid}>
        <article className={styles.benefitCard}>
          <strong>Высокая прочность</strong>
          <span>Кварцевый агломерат устойчив к механическим нагрузкам, потертостям и царапинам.</span>
        </article>
        <article className={styles.benefitCard}>
          <strong>Отсутствие пор</strong>
          <span>Однородная структура не впитывает запахи и жидкости, поверхность легко поддерживать в чистоте.</span>
        </article>
        <article className={styles.benefitCard}>
          <strong>Стойкость к химии</strong>
          <span>Материал стабилен при контакте с бытовыми кислотами и щелочами в рамках повседневного использования.</span>
        </article>
        <article className={styles.benefitCard}>
          <strong>Температурная стойкость</strong>
          <span>Поверхность устойчива к горячей посуде, не теряет геометрию и внешний вид.</span>
        </article>
      </div>

      {activeBrand ? <BrandSwatches key={activeBrand} stones={filtered} /> : null}
    </section>
  );
}
