import styles from "./calculator.module.scss";

/** Фото кварца (фрагмент образца с еврокамня), лежит в `public/images/calculator`. */
export const STONE_TEXTURE_SRC = "/images/calculator/stone-texture.jpg";

export type StoneArea = { x: number; y: number; width: number; height: number };

/** Габарит контура (мм) → область заливки. */
export function bboxArea(bbox: { minX: number; minY: number; maxX: number; maxY: number }): StoneArea {
  return { x: bbox.minX, y: bbox.minY, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY };
}

/** id из `useId` годится для `url(#…)` не всегда (двоеточия, кавычки), поэтому оставляем только безопасные символы. */
export function svgSafeId(raw: string) {
  return `stone-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * Заливка чертежа и превью форм фотографией камня.
 * Фото растягивается на габарит изделия (`area`, в единицах viewBox) без искажений: лишнее обрезается,
 * контур вырезает из него нужную форму. Под фото лежит однотонный фон, пока оно не загрузилось.
 */
export function StonePattern({ id, area }: { id: string; area: StoneArea }) {
  return (
    <pattern id={id} x={area.x} y={area.y} width={area.width} height={area.height} patternUnits="userSpaceOnUse">
      <rect width={area.width} height={area.height} className={styles.stoneBase} />
      <image
        href={STONE_TEXTURE_SRC}
        width={area.width}
        height={area.height}
        preserveAspectRatio="xMidYMid slice"
      />
    </pattern>
  );
}
