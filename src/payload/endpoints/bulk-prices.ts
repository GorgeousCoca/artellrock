import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres/drizzle";
import {
  addDataAndFileToRequest,
  commitTransaction,
  initTransaction,
  killTransaction,
  type Endpoint,
  type PayloadHandler,
  type PayloadRequest
} from "payload";

import { bulkPricesSchema, planBulkUpdate, summarizePlan, type CurrentMaterial } from "../../lib/calculator/stone-prices";
import { invalidate, SKIP_REVALIDATE_CONTEXT } from "../hooks/revalidate";

/**
 * Эндпоинты массовой работы с ценами камней. Это НЕ служебный скрипт: любая ошибка здесь меняет цены в продаже.
 *
 *   POST /api/materials/bulk-prices      { rows: [{ id, pricePerSqm, isActive, updatedAt }] }
 *   POST /api/materials/revalidate-cache  (без тела)
 *
 * Гарантии `bulk-prices`:
 *  - только вошедший пользователь (`req.user`), иначе 401 и ничего не читается и не пишется;
 *  - вход проверяет zod (`stone-prices.ts`): целая цена 0…1 000 000, кратная 250 ₽, не более 700 строк, без повторов id;
 *  - всё в одной транзакции или ничего: любая ошибка в любой строке (чужая правка, запись удалена) откатывает всё;
 *  - защита от одновременной правки: если `updatedAt` в БД новее присланного, строка отклоняется с понятной
 *    ошибкой (409). Параллельные массовые сохранения сериализует advisory-lock Postgres внутри транзакции;
 *  - цена 0 выключает позицию (валидатор `materials.pricePerSqm` не даёт активировать материал с ценой 0);
 *  - кэш: в хуках `afterChange` сброс пропускается (контекст `skipRevalidate`), тег `materials` сбрасывается ОДИН
 *    раз после коммита, поэтому публичный `getMaterials` обновляется сразу, а не через час.
 * Доступ — как у остальных операций записи (`isAuthenticated`): ролей в проекте нет, любой вошедший = администратор.
 */

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Ключ advisory-lock: один на все массовые сохранения цен. */
const LOCK_SQL = sql`select pg_advisory_xact_lock(hashtext('artellrock:materials:bulk-prices'))`;

async function lockBulkWrites(req: PayloadRequest) {
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const transactionID = req.transactionID ? await req.transactionID : undefined;
  const db = (transactionID !== undefined ? adapter.sessions[transactionID]?.db : undefined) ?? adapter.drizzle;
  await db.execute(LOCK_SQL);
}

export const bulkPricesHandler: PayloadHandler = async (req) => {
  if (!req.user) return json({ ok: false, error: "Войдите в админку, чтобы менять цены." }, 401);

  await addDataAndFileToRequest(req);
  const parsed = bulkPricesSchema.safeParse(req.data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    const stepIssue = issues.find((issue) => issue.message.includes("250"));
    return json(
      {
        ok: false,
        error: stepIssue?.message ?? "Некорректный запрос.",
        issues
      },
      400
    );
  }
  const { rows } = parsed.data;

  const transactionStarted = await initTransaction(req);
  try {
    await lockBulkWrites(req);

    // Читаем текущие значения уже под блокировкой, внутри транзакции.
    const found = await req.payload.find({
      collection: "materials",
      where: { id: { in: rows.map((row) => row.id) } },
      limit: rows.length,
      pagination: false,
      depth: 0,
      select: { pricePerSqm: true, isActive: true, updatedAt: true },
      req,
      user: req.user,
      overrideAccess: false
    });
    const current = new Map<number, CurrentMaterial>(
      found.docs.map((doc) => [
        Number(doc.id),
        { id: Number(doc.id), pricePerSqm: doc.pricePerSqm, isActive: Boolean(doc.isActive), updatedAt: doc.updatedAt }
      ])
    );

    const plan = planBulkUpdate(rows, current);
    const failures = plan.flatMap((entry) =>
      entry.status === "error" ? [{ id: entry.id, code: entry.code, message: entry.message }] : []
    );
    if (failures.length > 0) {
      if (transactionStarted) await killTransaction(req);
      const conflict = failures.some((failure) => failure.code === "conflict");
      return json(
        {
          ok: false,
          error: conflict
            ? "Часть цен уже изменил другой пользователь. Ничего не сохранено: обновите страницу и повторите."
            : "Часть материалов не найдена. Ничего не сохранено.",
          summary: summarizePlan(plan),
          errors: failures
        },
        conflict ? 409 : 404
      );
    }

    const saved: Array<{ id: number; pricePerSqm: number; isActive: boolean; updatedAt: string }> = [];
    for (const entry of plan) {
      if (entry.status !== "update") continue;
      const doc = await req.payload.update({
        collection: "materials",
        id: entry.id,
        data: entry.data,
        depth: 0,
        select: { pricePerSqm: true, isActive: true, updatedAt: true },
        req,
        user: req.user,
        overrideAccess: false,
        context: { [SKIP_REVALIDATE_CONTEXT]: true }
      });
      saved.push({ id: Number(doc.id), pricePerSqm: doc.pricePerSqm, isActive: Boolean(doc.isActive), updatedAt: doc.updatedAt });
    }

    if (transactionStarted) await commitTransaction(req);

    // Один сброс на весь запрос — уже после коммита, чтобы кэш не пересобрался из старых данных.
    if (saved.length > 0) invalidate("materials");

    return json({ ok: true, summary: summarizePlan(plan), rows: saved });
  } catch (error) {
    if (transactionStarted) {
      try {
        await killTransaction(req);
      } catch {
        /* транзакция уже закрыта */
      }
    }
    req.payload.logger.error({ err: error, msg: "materials/bulk-prices: ошибка сохранения цен, откат" });
    return json({ ok: false, error: "Не удалось сохранить цены, изменения откачены. Попробуйте ещё раз." }, 500);
  }
};

/**
 * Сброс кэша каталога калькулятора. Нужен скриптам (`payload run` не может сбросить кэш работающего сервера).
 * Кроме материалов сбрасываются кромки, бортики, мойки и услуги: нормализация цен правит все эти коллекции.
 */
export const revalidateCacheHandler: PayloadHandler = (req) => {
  if (!req.user) return json({ ok: false, error: "Требуется вход." }, 401);
  for (const slug of ["materials", "edges", "backsplashes", "sinks", "additional-services"]) invalidate(slug);
  return json({ ok: true });
};

export const materialsEndpoints: Endpoint[] = [
  { path: "/bulk-prices", method: "post", handler: bulkPricesHandler },
  { path: "/revalidate-cache", method: "post", handler: revalidateCacheHandler }
];
