/**
 * Серверная часть калькулятора: чтение каталога из Payload и авторитетный расчёт.
 *
 * Файл НЕ помечен "use server" и не должен импортироваться из клиентских компонентов: он нужен
 * страницам (RSC), Route Handler'ам и Server Actions. Единственное, что считается в нём как «истина», —
 * `computeEstimate`: он берёт идентификаторы из проверенного входа, читает цены из БД и вызывает чистый `buildEstimate`.
 */
import { unstable_cache } from "next/cache";

import { CMS_CACHE_TTL_SECONDS, cmsTag } from "@/lib/cms/tags";
import { getPayloadClient } from "@/lib/cms/client";
import type { AdditionalService, Backsplash, Edge, Material, Sink } from "@/payload-types";

import { buildEstimate, type CatalogSnapshot, type Estimate } from "./estimate";
import { unavailableThicknessMessage } from "./thickness-availability";
import { roundToPriceStep } from "./price-rounding";
import { isCatalogId, type CalculatorInput } from "./schema";
import { splitTags, STONE_FINISHES, STONE_FORMATS, STONE_THICKNESSES_MM, unitForMode, type StoneFinish, type StoneFormat } from "./taxonomy";
import type {
  BacksplashRecord,
  CalculatorCatalog,
  EdgeRecord,
  MaterialRecord,
  ServiceRecord,
  SinkRecord
} from "./types";

const orNull = <T,>(value: T | null | undefined): T | undefined => value ?? undefined;

const FORMAT_VALUES = new Set<string>(STONE_FORMATS.map((format) => format.value));
const THICKNESS_VALUES = new Set<number>(STONE_THICKNESSES_MM);
const FINISH_VALUES = new Set<string>(STONE_FINISHES.map((finish) => finish.value));

/** Цена из БД → кратное 250. Старые некратные и битые значения не роняют каталог. */
const storedPrice = (value: number | null | undefined) =>
  roundToPriceStep(typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0);

function asFormats(value: Material["formats"]): StoneFormat[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoneFormat => typeof item === "string" && FORMAT_VALUES.has(item));
}

function asThicknesses(value: Material["thicknessesMm"]): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => Number(item)).filter((item) => THICKNESS_VALUES.has(item));
}

function asFinish(value: Material["finish"]): StoneFinish | undefined {
  return typeof value === "string" && FINISH_VALUES.has(value) ? (value as StoneFinish) : undefined;
}

// ---------------------------------------------------------------------------------------------
// Документ Payload -> запись каталога (явное сопоставление: наружу уходит только нужное)
// ---------------------------------------------------------------------------------------------

export const toMaterial = (doc: Material): MaterialRecord => ({
  id: String(doc.id),
  brand: doc.brand,
  name: doc.name,
  sku: orNull(doc.sku),
  formats: asFormats(doc.formats),
  thicknessesMm: asThicknesses(doc.thicknessesMm),
  shades: splitTags(doc.shade),
  finish: asFinish(doc.finish),
  textures: splitTags(doc.texture),
  pricePerSqm: storedPrice(doc.pricePerSqm),
  sheetLengthMm: orNull(doc.sheetLengthMm),
  sheetWidthMm: orNull(doc.sheetWidthMm),
  image: orNull(doc.image)
});

export const toEdge = (doc: Edge): EdgeRecord => ({
  id: String(doc.id),
  kind: doc.kind,
  name: doc.name,
  thicknessMm: orNull(doc.thicknessMm),
  pricePerMeter: storedPrice(doc.pricePerMeter),
  image: orNull(doc.image)
});

export const toBacksplash = (doc: Backsplash): BacksplashRecord => ({
  id: String(doc.id),
  name: doc.name,
  heightMm: orNull(doc.heightMm),
  pricePerMeter: storedPrice(doc.pricePerMeter),
  image: orNull(doc.image)
});

export const toSink = (doc: Sink): SinkRecord => ({
  id: String(doc.id),
  type: doc.type,
  name: doc.name,
  description: orNull(doc.description),
  price: storedPrice(doc.price),
  image: orNull(doc.image)
});

export const toService = (doc: AdditionalService): ServiceRecord => ({
  id: String(doc.id),
  name: doc.name,
  category: doc.category,
  price: storedPrice(doc.price),
  quantityMode: doc.quantityMode,
  unit: unitForMode(doc.quantityMode) ?? doc.unit ?? "piece",
  autoApply: Boolean(doc.autoApply),
  hint: orNull(doc.hint)
});

/**
 * Строковый id из запроса -> числовой id Postgres. Безопасен только для идентификаторов, прошедших
 * `isCatalogId` (1–9 цифр без ведущих нулей: точно представимы в `Number` и помещаются в `integer`);
 * на всё остальное бросает, чтобы запрос не дошёл до БД с «007» или 18-значным числом.
 */
const toPayloadId = (id: string) => {
  if (!isCatalogId(id)) throw new Error(`Некорректный идентификатор каталога: ${id}`);
  return Number(id);
};

// ---------------------------------------------------------------------------------------------
// Публичные справочники (кэш с тегами, сбрасывается хуками коллекций при правке в админке)
// ---------------------------------------------------------------------------------------------

async function fetchCatalog(): Promise<CalculatorCatalog> {
  const payload = await getPayloadClient();
  const active = { isActive: { equals: true } };
  const base = { depth: 0, limit: 0, pagination: false, sort: "sortOrder" } as const;

  const [edges, backsplashes, sinks, services] = await Promise.all([
    payload.find({ collection: "edges", where: active, ...base }),
    payload.find({ collection: "backsplashes", where: active, ...base }),
    payload.find({ collection: "sinks", where: active, ...base }),
    payload.find({
      collection: "additional-services",
      where: { and: [active, { autoApply: { not_equals: true } }] },
      ...base
    })
  ]);

  return {
    edges: edges.docs.map(toEdge),
    backsplashes: backsplashes.docs.map(toBacksplash),
    sinks: sinks.docs.map(toSink),
    services: services.docs.map(toService)
  };
}

/** Небольшие справочники для шагов 3–5. */
// v3: из справочника убраны профили без картинок. Новый ключ, чтобы работающий сервер
// не отдавал старый список до часа, если скрипт сидера не смог сбросить кэш.
export const getCalculatorCatalog = unstable_cache(fetchCatalog, ["calculator-catalog-v3"], {
  tags: ["edges", "backsplashes", "sinks", "additional-services"].map(cmsTag),
  revalidate: CMS_CACHE_TTL_SECONDS
});

async function fetchMaterials(): Promise<MaterialRecord[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "materials",
    // Материал без цены в калькулятор не попадает (и не может быть продан «за 0 ₽»).
    where: { and: [{ isActive: { equals: true } }, { pricePerSqm: { greater_than: 0 } }] },
    sort: ["brand", "sortOrder", "name"],
    depth: 0,
    limit: 0,
    pagination: false
  });
  return result.docs.map(toMaterial);
}

/** Весь каталог материалов (лёгкие записи) для шага 2. */
export const getMaterials = unstable_cache(fetchMaterials, ["calculator-materials-v2"], {
  tags: [cmsTag("materials")],
  revalidate: CMS_CACHE_TTL_SECONDS
});

/** Материал со статусом показа. Витрина каталога сама решает, чья цена отображается. */
export type CatalogMaterial = MaterialRecord & { isActive: boolean };

async function fetchAllMaterials(): Promise<CatalogMaterial[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: "materials", depth: 0, limit: 0, pagination: false });

  return result.docs.map((doc) => ({ ...toMaterial(doc), isActive: doc.isActive === true }));
}

/**
 * Все материалы, включая скрытые и без цены, для витрины `/catalog-kvarca`. Тот же тег `cms:materials`,
 * что у `getMaterials`: правка в админке сбрасывает оба кэша. Это отдельная выборка, не копия:
 * калькулятор берёт только активные с ценой, витрине нужны остальные для характеристик.
 */
export const getAllMaterials = unstable_cache(fetchAllMaterials, ["quartz-catalog-materials-v1"], {
  tags: [cmsTag("materials")],
  revalidate: CMS_CACHE_TTL_SECONDS
});

// ---------------------------------------------------------------------------------------------
// Авторитетный расчёт
// ---------------------------------------------------------------------------------------------

export type EstimateFailure = { ok: false; error: string; field?: string };
export type EstimateSuccess = { ok: true; estimate: Estimate };
export type EstimateOutcome = EstimateSuccess | EstimateFailure;

type SnapshotOutcome = { ok: true; snapshot: CatalogSnapshot; material?: MaterialRecord } | EstimateFailure;

/**
 * Собирает записи каталога по идентификаторам из запроса. Читает БД напрямую (без кэша): цены в смете
 * должны быть теми, что в админке сейчас. Любая ссылка на несуществующую, скрытую или неподходящую запись — ошибка.
 */
export async function loadSnapshot(input: CalculatorInput): Promise<SnapshotOutcome> {
  // Схема уже отсеивает такие id, но функция экспортируется: не полагаемся на то, что её вызовут только после схемы.
  const references: Array<[string | undefined, string]> = [
    [input.materialId, "materialId"],
    [input.thicknessId, "thicknessId"],
    [input.profileId, "profileId"],
    [input.backsplashId, "backsplashId"],
    [input.sinkId, "sinkId"],
    ...input.services.map((service): [string, string] => [service.serviceId, "services"])
  ];
  const badReference = references.find(([id]) => id !== undefined && !isCatalogId(id));
  if (badReference) return { ok: false, error: "Некорректный идентификатор в запросе.", field: badReference[1] };

  const payload = await getPayloadClient();
  const active = { isActive: { equals: true } };
  const single = { depth: 0, limit: 1, pagination: false } as const;

  const edgeIds = [input.thicknessId, input.profileId].filter((id): id is string => Boolean(id));
  const serviceIds = input.services.map((s) => s.serviceId);

  const [material, edges, backsplash, sink, services] = await Promise.all([
    input.materialId
      ? payload.find({
          collection: "materials",
          where: { and: [{ id: { equals: toPayloadId(input.materialId) } }, active, { pricePerSqm: { greater_than: 0 } }] },
          ...single
        })
      : null,
    edgeIds.length
      ? payload.find({
          collection: "edges",
          where: { and: [{ id: { in: edgeIds.map(toPayloadId) } }, active] },
          depth: 0,
          limit: edgeIds.length,
          pagination: false
        })
      : null,
    input.backsplashId
      ? payload.find({ collection: "backsplashes", where: { and: [{ id: { equals: toPayloadId(input.backsplashId) } }, active] }, ...single })
      : null,
    input.sinkId
      ? payload.find({ collection: "sinks", where: { and: [{ id: { equals: toPayloadId(input.sinkId) } }, active] }, ...single })
      : null,
    payload.find({
      collection: "additional-services",
      where: {
        and: [
          active,
          { or: [{ autoApply: { equals: true } }, ...(serviceIds.length ? [{ id: { in: serviceIds.map(toPayloadId) } }] : [])] }
        ]
      },
      depth: 0,
      limit: 0,
      pagination: false
    })
  ]);

  if (input.materialId && !material?.docs[0]) {
    return { ok: false, error: "Выбранный материал больше недоступен. Выберите другой.", field: "materialId" };
  }

  const edgeById = new Map((edges?.docs ?? []).map((doc) => [String(doc.id), toEdge(doc)]));
  const thickness = input.thicknessId ? edgeById.get(input.thicknessId) : undefined;
  const profile = input.profileId ? edgeById.get(input.profileId) : undefined;

  if (input.thicknessId && thickness?.kind !== "thickness") {
    return { ok: false, error: "Выбранная толщина кромки недоступна.", field: "thicknessId" };
  }
  if (input.profileId && profile?.kind !== "profile") {
    return { ok: false, error: "Выбранный профиль кромки недоступен.", field: "profileId" };
  }
  if (input.backsplashId && !backsplash?.docs[0]) {
    return { ok: false, error: "Выбранный бортик недоступен.", field: "backsplashId" };
  }
  if (input.sinkId && !sink?.docs[0]) {
    return { ok: false, error: "Выбранная мойка недоступна.", field: "sinkId" };
  }

  const serviceRecords = services.docs.map(toService);
  const found = new Set(serviceRecords.map((s) => s.id));
  const missing = input.services.find((s) => !found.has(s.serviceId));
  if (missing) {
    return { ok: false, error: "Одна из выбранных услуг больше недоступна.", field: "services" };
  }
  // Автоматические позиции выбрать нельзя — их добавляет только сервер.
  const forbidden = serviceRecords.find((s) => s.autoApply && input.services.some((x) => x.serviceId === s.id));
  if (forbidden) {
    return { ok: false, error: "Некорректный набор услуг.", field: "services" };
  }

  const materialRecord = material?.docs[0] ? toMaterial(material.docs[0]) : undefined;

  // Камень с известными толщинами не продаём с чужой толщиной кромки. Пустой список — данные неизвестны.
  const denied = unavailableThicknessMessage(thickness, materialRecord?.thicknessesMm);
  if (denied) return { ok: false, error: denied, field: "thicknessId" };

  return {
    ok: true,
    material: materialRecord,
    snapshot: {
      material: materialRecord,
      thickness,
      profile,
      backsplash: backsplash?.docs[0] ? toBacksplash(backsplash.docs[0]) : undefined,
      sink: sink?.docs[0] ? toSink(sink.docs[0]) : undefined,
      services: serviceRecords
    }
  };
}

/** Проверенный вход -> смета (цены из БД). Единая точка расчёта для предпросчёта и для заявки. */
export async function computeEstimate(input: CalculatorInput): Promise<EstimateOutcome & { material?: MaterialRecord }> {
  const loaded = await loadSnapshot(input);
  if (!loaded.ok) return loaded;
  return { ok: true, estimate: buildEstimate(input, loaded.snapshot), material: loaded.material };
}
