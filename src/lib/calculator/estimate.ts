/**
 * Расчёт сметы. Чистая функция: (проверенный вход, записи каталога из БД) -> смета.
 *
 * Ни I/O, ни цен в коде. Источник цен — только `CatalogSnapshot`, который сервер собирает из Payload
 * по идентификаторам из запроса. Благодаря этому:
 *  - результат детерминирован и покрывается тестами без БД;
 *  - одну и ту же функцию вызывают предпросчёт (Server Action) и сохранение заявки, расхождений нет.
 *
 * Правила округления:
 *  - количества (м², м.п.) округляются до сотых ДО умножения;
 *  - сумма каждой строки округляется до 250 ₽ (ближайшее кратное, половина вверх);
 *  - итог — сумма округлённых строк, поэтому тоже кратен 250;
 *  - цена за единицу остаётся как в каталоге, отдельно её не округляем.
 */
import { measureItem } from "./geometry";
import { roundToPriceStep } from "./price-rounding";
import type { CalculatorInput } from "./schema";
import type { QuantityMode, ServiceUnit } from "./taxonomy";
import type {
  BacksplashRecord,
  EdgeRecord,
  MaterialRecord,
  ServiceRecord,
  SinkRecord
} from "./types";

export type EstimateLineKind = "material" | "thickness" | "profile" | "backsplash" | "sink" | "service";

export type EstimateLine = {
  key: string;
  kind: EstimateLineKind;
  name: string;
  quantity: number;
  unit: ServiceUnit;
  unitPrice: number;
  /** Целые рубли, кратные 250. */
  amount: number;
};

export type EstimateTotals = {
  itemCount: number;
  areaSqm: number;
  perimeterM: number;
  edgeM: number;
  backsplashM: number;
  roundedCorners: number;
};

export type Estimate = {
  lines: EstimateLine[];
  /** Целые рубли, сумма `lines[].amount`. */
  total: number;
  totals: EstimateTotals;
  items: Array<{ id: string; areaSqm: number; perimeterM: number }>;
  /** Ориентировочное число листов материала (площадь / площадь листа) или null, если размер листа не задан. */
  sheets: number | null;
  warnings: string[];
};

/** Записи каталога, по которым считается смета. Собирается на сервере из БД. */
export type CatalogSnapshot = {
  material?: MaterialRecord;
  thickness?: EdgeRecord;
  profile?: EdgeRecord;
  backsplash?: BacksplashRecord;
  sink?: SinkRecord;
  /** Выбранные клиентом услуги + все услуги с autoApply. */
  services: ServiceRecord[];
};

export const round2 = (value: number) => Math.round(value * 100) / 100;

/** Суммарные показатели по всем изделиям. */
export function measureInput(items: CalculatorInput["items"]): EstimateTotals & {
  perItem: Array<{ id: string; areaSqm: number; perimeterM: number }>;
} {
  let areaMm2 = 0;
  let perimeterMm = 0;
  let edgeMm = 0;
  let backsplashMm = 0;
  let roundedCorners = 0;
  const perItem: Array<{ id: string; areaSqm: number; perimeterM: number }> = [];

  for (const item of items) {
    const m = measureItem(item);
    areaMm2 += m.areaMm2;
    perimeterMm += m.perimeterMm;
    edgeMm += m.edgeLengthMm;
    backsplashMm += m.backsplashLengthMm;
    roundedCorners += m.roundedCorners;
    perItem.push({ id: item.id, areaSqm: round2(m.areaMm2 / 1e6), perimeterM: round2(m.perimeterMm / 1000) });
  }

  return {
    itemCount: items.length,
    areaSqm: areaMm2 / 1e6,
    perimeterM: perimeterMm / 1000,
    edgeM: edgeMm / 1000,
    backsplashM: backsplashMm / 1000,
    roundedCorners,
    perItem
  };
}

/** Количество услуги. Все режимы, кроме `user`, берутся из геометрии, а не из запроса клиента. */
export function serviceQuantity(
  service: Pick<ServiceRecord, "quantityMode" | "unit">,
  totals: EstimateTotals,
  requested?: number
): number {
  const byMode: Record<Exclude<QuantityMode, "user">, number> = {
    once: 1,
    area: round2(totals.areaSqm),
    perimeter: round2(totals.perimeterM),
    edge: round2(totals.edgeM),
    backsplash: round2(totals.backsplashM),
    "rounded-corners": totals.roundedCorners
  };

  if (service.quantityMode === "user") {
    const value = requested ?? 1;
    return service.unit === "piece" ? Math.max(1, Math.round(value)) : round2(value);
  }
  return byMode[service.quantityMode];
}

function makeLine(
  key: string,
  kind: EstimateLineKind,
  name: string,
  quantity: number,
  unit: ServiceUnit,
  unitPrice: number
): EstimateLine {
  return { key, kind, name, quantity, unit, unitPrice, amount: roundToPriceStep(quantity * unitPrice) };
}

export function buildEstimate(input: CalculatorInput, catalog: CatalogSnapshot): Estimate {
  const measured = measureInput(input.items);
  const { perItem, ...totals } = measured;
  const warnings: string[] = [];
  const lines: EstimateLine[] = [];

  const area = round2(totals.areaSqm);

  const { material, thickness, profile, backsplash, sink } = catalog;

  if (material) {
    lines.push(
      makeLine(
        `material:${material.id}`,
        "material",
        `${material.brand} ${material.name}`.trim(),
        area,
        "sqm",
        material.pricePerSqm
      )
    );
  }

  const requested = new Map(input.services.map((s) => [s.serviceId, s.quantity]));
  const autoServices = catalog.services.filter((s) => s.autoApply);
  const chosenServices = catalog.services.filter((s) => !s.autoApply && requested.has(s.id));

  const pushService = (service: ServiceRecord) => {
    const quantity = serviceQuantity(service, totals, requested.get(service.id));
    if (quantity <= 0) {
      if (!service.autoApply) warnings.push(`«${service.name}» не применена: для выбранных изделий она не нужна.`);
      return;
    }
    lines.push(makeLine(`service:${service.id}`, "service", service.name, quantity, service.unit, service.price));
  };

  autoServices.forEach(pushService);

  const edgeM = round2(totals.edgeM);
  if (thickness) {
    if (edgeM > 0) lines.push(makeLine(`thickness:${thickness.id}`, "thickness", thickness.name, edgeM, "meter", thickness.pricePerMeter));
    else warnings.push("Выбрана толщина кромки, но на изделиях не отмечено ни одной стороны с кромкой.");
  }
  if (profile) {
    if (edgeM > 0) lines.push(makeLine(`profile:${profile.id}`, "profile", profile.name, edgeM, "meter", profile.pricePerMeter));
    else warnings.push("Выбран профиль кромки, но на изделиях не отмечено ни одной стороны с кромкой.");
  }

  const backsplashM = round2(totals.backsplashM);
  if (backsplash) {
    if (backsplashM > 0) {
      lines.push(makeLine(`backsplash:${backsplash.id}`, "backsplash", backsplash.name, backsplashM, "meter", backsplash.pricePerMeter));
    } else {
      warnings.push("Выбран бортик, но на изделиях не отмечено ни одной стороны с бортиком.");
    }
  }

  if (sink) lines.push(makeLine(`sink:${sink.id}`, "sink", sink.name, 1, "piece", sink.price));

  chosenServices.forEach(pushService);

  if (!material) warnings.push("Материал не выбран: в сумму не входит стоимость камня.");

  const sheetArea =
    material?.sheetLengthMm && material.sheetWidthMm ? (material.sheetLengthMm * material.sheetWidthMm) / 1e6 : 0;

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    totals: {
      itemCount: totals.itemCount,
      areaSqm: area,
      perimeterM: round2(totals.perimeterM),
      edgeM,
      backsplashM,
      roundedCorners: totals.roundedCorners
    },
    items: perItem,
    sheets: sheetArea > 0 ? round2(totals.areaSqm / sheetArea) : null,
    warnings
  };
}
