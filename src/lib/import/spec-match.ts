/**
 * Сопоставление «строка файла характеристик ↔ материал в БД». Чистая функция: БД не читает.
 *
 * Ключ строится так же, как у прайса (`normalizeTitle` / `materialKey`): регистр, скобки, «мм»/«mm»,
 * признаки мата «(Мат)» / «Matt» / «матовый». Дополнительно, и только здесь, перед ключом:
 *  - токен `OFF` отбрасывается (в названии БД его нет; полировка при этом живёт в поле файла);
 *  - `(M)` становится токеном `mat`, как другие признаки мата;
 *  - повтор подряд идущего `mat` схлопывается («Matt (M)» — одна пометка, не два слова);
 *  - дефис в артикуле и прочие систематические расхождения — только таблица `BRAND_ALIASES`.
 *
 * Признак мата сравнивается отдельно от остальных слов: мат в названии файла и отсутствие мата
 * у кандидата (или наоборот) — это не совпадение. Полировка файла (`матовый` ↔ мат-токен БД)
 * в решение не входит, она только подсказка `polishHints` для отчёта.
 *
 * Avant Quartz и Avarus сопоставляются по артикулу (`SKU_MATCHED_BRANDS`): в файле кириллица,
 * в БД транслит, как в прайсе. Опечатки не исправляются. Несколько кандидатов или две строки
 * файла на один материал — ошибка, без догадок.
 */
import { hasMat, materialKey, normalizeTitle, SKU_MATCHED_BRANDS, stripMat, type MaterialLike } from "@/lib/catalog/identity";
import type { SpecRow } from "./spec-list";

export type BrandAlias = {
  brand: string;
  /** Чем правило обосновано. Без записи в этой таблице название файла не переписывается. */
  reason: string;
  /** Правка названия файла до `normalizeTitle`. */
  rewrite?: (title: string) => string;
  /**
   * Строка файла может состоять из одного артикула (плюс признак мата), без коммерческого имени.
   * Тогда ключ сравнивается с `sku`, и только если полное название не совпало ни с одним материалом.
   * Лишнее слово сверх артикула сюда не попадает: «5050 Forza» не становится «5050 Forza Fume».
   */
  bareArticle?: boolean;
};

/** Дефис между буквой и цифрами артикула → пробел: «BQ-2600» → «BQ 2600», «EQHM-001» → «EQHM 001». */
function hyphenToSpace(title: string): string {
  return title.replace(/(\p{L})-(\d)/gu, "$1 $2");
}

/** Тот же дефис выкидывается: «Q-117» → «Q117», «AD-151» → «AD151». */
function hyphenJoin(title: string): string {
  return title.replace(/(\p{L})-(\d)/gu, "$1$2");
}

export const BRAND_ALIASES: readonly BrandAlias[] = [
  {
    brand: "Asterum",
    reason:
      "В файле артикул с префиксом бренда «A-» и ведущими нулями («A-0001»), в БД артикул без префикса («0001»). Буква A не часть артикула.",
    rewrite: (title) => title.replace(/^A-(?=\d)/, "")
  },
  {
    brand: "Noblle Quartz",
    reason:
      "В файле артикул с дефисом («Q-117 Jade White»), в БД дефиса нет («Q117 Jade White»). Часть строк — только артикул («Q-650»), имя есть только в БД.",
    rewrite: hyphenJoin,
    bareArticle: true
  },
  {
    brand: "Vicostone",
    reason:
      "В файле только артикул с дефисом и без имени («BQ-2600»). В БД артикул пишется через пробел плюс коммерческое имя («BQ 2600 Valley White»).",
    rewrite: hyphenToSpace,
    bareArticle: true
  },
  {
    brand: "Etna Quartz",
    reason:
      "В файле артикул с дефисом («EQHM-001»), в БД пробел и коммерческое имя («EQHM 001 Perlino Bianco»). «(print)» — пометка печати, в названии БД её нет.",
    rewrite: (title) => hyphenToSpace(title).replace(/\(print\)/gi, " "),
    bareArticle: true
  },
  {
    brand: "Radianz",
    reason:
      "В файле артикул с дефисом («AD-151»), в БД слитно и с именем («AD151 Alinda»). Строки файла — только артикул.",
    rewrite: hyphenJoin,
    bareArticle: true
  },
  {
    brand: "Belenco",
    reason:
      "Часть строк — голый номер без имени («4110»), в БД к нему добавлено имя («4110 Diamond White»). Строка, в которой имя уже есть, сверяется целиком и до голого артикула не опускается.",
    bareArticle: true
  },
  {
    brand: "Caesarstone",
    reason: "В файле пометка линейки «(RAD)» или «(IS)». В БД и в прайсе этой пометки нет.",
    rewrite: (title) => title.replace(/\((?:RAD|IS)\)/gi, " ")
  },
  {
    brand: "Primax",
    reason:
      "«(3D M)» — матовый 3D-вариант, в БД это «Mat» без «3D». «PRINT» и «(PRINT FB)» — пометка печати, в названии БД её нет.",
    rewrite: (title) => title.replace(/\(3D\s*M\)/gi, " mat ").replace(/\(PRINT\s*FB\)/gi, " ").replace(/\bPRINT\b/g, " ")
  }
];

/** Те же бренды, что в прайсе: кириллическое название файла против транслита в БД, артикул уникален. */
export const SPEC_SKU_BRANDS: readonly string[] = SKU_MATCHED_BRANDS;

function collapseRepeatedMat(key: string): string {
  const out: string[] = [];
  for (const token of key.split(" ")) {
    if (!token) continue;
    if (token === "mat" && out[out.length - 1] === "mat") continue;
    out.push(token);
  }
  return out.join(" ");
}

/** Ключ названия из файла характеристик (уже с алиасами бренда и токеном мата). */
export function specFileKey(brand: string, title: string): string {
  let text = title
    .split(/\s+/)
    .filter((token) => token.toLowerCase() !== "off")
    .join(" ");
  text = text.replace(/\(M\)/gi, " mat ");
  const alias = BRAND_ALIASES.find((item) => item.brand === brand);
  if (alias?.rewrite) text = alias.rewrite(text);
  return collapseRepeatedMat(normalizeTitle(text));
}


export type SpecHit = {
  row: SpecRow;
  material: MaterialLike;
  via: "key" | "sku" | "article";
};

export type SpecProblem = {
  row: SpecRow;
  reason: string;
  /** Кто подошёл по названию/артикулу, но не стал совпадением (мат, несколько записей). */
  candidates: MaterialLike[];
  /** Справка: материалы бренда, чей мат-токен согласован с полировкой файла. В решение не входит. */
  polishHints: MaterialLike[];
};

export type SpecMatchResult = {
  matched: SpecHit[];
  notFound: SpecProblem[];
  ambiguous: SpecProblem[];
};

type Lookup =
  | { ok: true; material: MaterialLike; via: SpecHit["via"] }
  | { ok: false; problem: "none" | "mat" | "many"; via: SpecHit["via"]; candidates: MaterialLike[] };

function decide(pool: MaterialLike[], fileMat: boolean, via: SpecHit["via"]): Lookup {
  const agreed = pool.filter((material) => hasMat(materialKey(material)) === fileMat);
  if (agreed.length === 1) return { ok: true, material: agreed[0], via };
  if (agreed.length > 1) return { ok: false, problem: "many", via, candidates: agreed };
  return { ok: false, problem: "mat", via, candidates: pool };
}

function lookup(row: SpecRow, brandMaterials: readonly MaterialLike[]): Lookup {
  const fileKey = specFileKey(row.brand, row.title);
  const stripped = stripMat(fileKey);
  const fileMat = hasMat(fileKey);
  const skuBrands = new Set(SPEC_SKU_BRANDS);

  if (skuBrands.has(row.brand)) {
    const article = stripped.split(" ")[0] ?? "";
    const pool = brandMaterials.filter((material) => article !== "" && normalizeTitle(material.sku ?? "") === article);
    if (pool.length === 0) return { ok: false, problem: "none", via: "sku", candidates: [] };
    return decide(pool, fileMat, "sku");
  }

  const byName = brandMaterials.filter((material) => stripped !== "" && stripMat(materialKey(material)) === stripped);
  if (byName.length > 0) return decide(byName, fileMat, "key");

  const alias = BRAND_ALIASES.find((item) => item.brand === row.brand);
  if (alias?.bareArticle) {
    const pool = brandMaterials.filter((material) => stripped !== "" && normalizeTitle(material.sku ?? "") === stripped);
    if (pool.length > 0) return decide(pool, fileMat, "article");
  }

  return { ok: false, problem: "none", via: "key", candidates: [] };
}

function reasonFor(row: SpecRow, found: Extract<Lookup, { ok: false }>, fileKey: string): string {
  const stripped = stripMat(fileKey);
  const article = stripped.split(" ")[0] ?? "";
  if (found.problem === "many") {
    const what = found.via === "sku" ? `артикул «${article}»` : `название «${stripped}»`;
    return `${what}: в БД ${found.candidates.length} подходящих материала`;
  }
  if (found.problem === "mat") {
    const what = found.via === "sku" ? `артикул «${article}»` : `название «${stripped}»`;
    return `${what}: признак матовости в названии файла и в БД не совпадает`;
  }
  if (found.via === "sku") return `в БД нет артикула «${article}»`;
  return `в БД нет записи с названием «${stripped}»`;
}

function polishHints(row: SpecRow, brandMaterials: readonly MaterialLike[]): MaterialLike[] {
  const wantMat = row.finish === "matte";
  const fileTokens = new Set(stripMat(specFileKey(row.brand, row.title)).split(" ").filter(Boolean));
  return brandMaterials
    .filter((material) => hasMat(materialKey(material)) === wantMat)
    .map((material) => {
      const tokens = stripMat(materialKey(material)).split(" ");
      const score = tokens.filter((token) => fileTokens.has(token)).length;
      return { material, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.material.id).localeCompare(String(b.material.id)))
    .slice(0, 5)
    .map((item) => item.material);
}

function groupRows(rows: readonly SpecRow[]): Map<string, SpecRow[]> {
  const groups = new Map<string, SpecRow[]>();
  for (const row of rows) {
    const key = `${row.brand}\0${specFileKey(row.brand, row.title)}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

export function matchSpecs(rows: readonly SpecRow[], materials: readonly MaterialLike[]): SpecMatchResult {
  const matched: SpecHit[] = [];
  const notFound: SpecProblem[] = [];
  const ambiguous: SpecProblem[] = [];
  const rowGroups = groupRows(rows);

  const materialsByBrand = new Map<string, MaterialLike[]>();
  for (const material of materials) {
    const group = materialsByBrand.get(material.brand);
    if (group) group.push(material);
    else materialsByBrand.set(material.brand, [material]);
  }

  for (const row of rows) {
    const brandMaterials = materialsByBrand.get(row.brand) ?? [];
    const fileKey = specFileKey(row.brand, row.title);
    const sameRows = rowGroups.get(`${row.brand}\0${fileKey}`) ?? [];
    const hints = () => polishHints(row, brandMaterials);

    if (brandMaterials.length === 0) {
      notFound.push({ row, reason: `бренда «${row.brand}» нет в БД`, candidates: [], polishHints: [] });
      continue;
    }
    if (sameRows.length > 1) {
      ambiguous.push({
        row,
        reason: `название «${fileKey}» повторяется в файле (${sameRows.length} раза)`,
        candidates: [],
        polishHints: hints()
      });
      continue;
    }

    const found = lookup(row, brandMaterials);
    if (!found.ok && found.problem === "many") {
      ambiguous.push({ row, reason: reasonFor(row, found, fileKey), candidates: found.candidates, polishHints: hints() });
      continue;
    }
    if (!found.ok) {
      notFound.push({ row, reason: reasonFor(row, found, fileKey), candidates: found.candidates, polishHints: hints() });
      continue;
    }
    matched.push({ row, material: found.material, via: found.via });
  }

  const byMaterial = new Map<string, SpecHit[]>();
  for (const hit of matched) {
    const id = String(hit.material.id);
    const group = byMaterial.get(id);
    if (group) group.push(hit);
    else byMaterial.set(id, [hit]);
  }
  const duplicated = new Set<string>();
  for (const [id, hits] of byMaterial) {
    if (hits.length > 1) duplicated.add(id);
  }
  if (duplicated.size > 0) {
    const kept: SpecHit[] = [];
    for (const hit of matched) {
      const id = String(hit.material.id);
      if (!duplicated.has(id)) {
        kept.push(hit);
        continue;
      }
      const lines = (byMaterial.get(id) ?? []).map((item) => item.row.line).join(", ");
      ambiguous.push({
        row: hit.row,
        reason: `строки файла ${lines} указывают на один материал #${id}`,
        candidates: [hit.material],
        polishHints: polishHints(hit.row, materialsByBrand.get(hit.row.brand) ?? [])
      });
    }
    matched.length = 0;
    matched.push(...kept);
  }

  const byLine = (a: SpecProblem, b: SpecProblem) => a.row.line - b.row.line;
  notFound.sort(byLine);
  ambiguous.sort(byLine);
  return { matched, notFound, ambiguous };
}

/**
 * Можно ли переходить к записи.
 * Неоднозначность блокирует всегда. Несопоставленные строки блокируют, пока явно не передан
 * `allowUnmatched` (`ALLOW_UNMATCHED=1` в скрипте импорта): их характеристики не угадываются и не пишутся.
 */
export function specImportBlocked(notFound: number, ambiguous: number, allowUnmatched: boolean): boolean {
  if (ambiguous > 0) return true;
  return notFound > 0 && !allowUnmatched;
}
