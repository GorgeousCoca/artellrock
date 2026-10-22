/**
 * Записи каталога в том виде, в котором их видит расчёт и интерфейс.
 *
 * Это НЕ типы Payload: расчёт не должен зависеть от CMS (его можно тестировать без БД), а наружу
 * (в клиент) уходят только нужные поля. Цены здесь — данные из БД, в коде их нет.
 */
import type { EdgeKind, QuantityMode, ServiceCategory, ServiceUnit, SinkType, StoneFinish, StoneFormat } from "./taxonomy";

export type MaterialRecord = {
  id: string;
  brand: string;
  name: string;
  sku?: string;
  /** Пустой массив, если формат в карточке не задан. */
  formats: StoneFormat[];
  /** Пустой массив, если толщина не задана. */
  thicknessesMm: number[];
  /** Оттенки после разбиения поля `shade` по « / ». Пустой массив, если данных нет. */
  shades: string[];
  finish?: StoneFinish;
  /** Фактуры после разбиения поля `texture` по « / ». Пустой массив, если данных нет. */
  textures: string[];
  /** ₽ за м², кратно 250. */
  pricePerSqm: number;
  sheetLengthMm?: number;
  sheetWidthMm?: number;
  /** Путь вида /images/... */
  image?: string;
};

export type EdgeRecord = {
  id: string;
  kind: EdgeKind;
  name: string;
  thicknessMm?: number;
  /** ₽ за м.п. */
  pricePerMeter: number;
  image?: string;
};

export type BacksplashRecord = {
  id: string;
  name: string;
  heightMm?: number;
  /** ₽ за м.п. */
  pricePerMeter: number;
  image?: string;
};

export type SinkRecord = {
  id: string;
  type: SinkType;
  name: string;
  /** Описание / размеры, например «X=150–450, Y=150–600 мм». */
  description?: string;
  price: number;
  image?: string;
};

export type ServiceRecord = {
  id: string;
  name: string;
  category: ServiceCategory;
  /** ₽ за единицу `unit`. */
  price: number;
  unit: ServiceUnit;
  quantityMode: QuantityMode;
  /** Всегда входит в смету (раскрой, базовая обработка), клиент её не выбирает. */
  autoApply: boolean;
  hint?: string;
};

/** Небольшие справочники, которые страница отдаёт клиенту сразу. Материалы грузятся отдельно (их много). */
export type CalculatorCatalog = {
  edges: EdgeRecord[];
  backsplashes: BacksplashRecord[];
  sinks: SinkRecord[];
  /** Только услуги, которые выбирает клиент (autoApply: false). */
  services: ServiceRecord[];
};

/** Карточка материала для клиента: ничего лишнего (размеры листа нужны только серверному расчёту). */
export type MaterialCard = Pick<
  MaterialRecord,
  "id" | "brand" | "name" | "sku" | "formats" | "thicknessesMm" | "shades" | "finish" | "textures" | "pricePerSqm" | "image"
>;
