import type { BrandPriceSpan } from "@/lib/catalog/quartz-match";
import { formatRub } from "@/lib/calculator/format";

export function brandDocumentTitle(name: string) {
  return `${name} — кварцевый агломерат в Петербурге — ArtellRock`;
}

export function brandHeading(name: string) {
  return `${name} — кварцевый агломерат`;
}

/** Текст на странице бренда: без цифр цены. Цена остаётся на карточке декора. */
export function brandPageLead(name: string) {
  return `${name}: кварцевый агломерат для изделий на заказ. Цена выбранного декора — на его странице. Образцы смотрим на бесплатном замере.`;
}

/** Уникальное описание бренда: имя и диапазон ₽/м², если цены есть в каталоге. */
export function brandMetaDescription(name: string, span: BrandPriceSpan | null): string {
  const price =
    span == null
      ? "цена декора в каталоге"
      : span.min === span.max
        ? `декор ${formatRub(span.min)} / м²`
        : `декоры от ${formatRub(span.min)} до ${formatRub(span.max)} / м²`;

  return `${name}: кварцевый агломерат в Петербурге, ${price}. Изделия на заказ. Образцы на бесплатном замере.`;
}

export function catalogMetaDescription(brandCount: number): string {
  return `Каталог кварцевого агломерата в Петербурге: ${brandCount} марок, цвета и цена за м². Замер бесплатный, расчёт — в калькуляторе.`;
}
