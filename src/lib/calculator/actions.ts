"use server";

/**
 * Server Actions калькулятора — граница доверия.
 *
 * Правила (см. node_modules/next/dist/docs/01-app/02-guides/server-actions.md → Security):
 *  1. Action — публичная точка входа: аргумент `unknown`, всё проверяется zod-схемой.
 *  2. Клиент присылает идентификаторы и геометрию. Цены, названия и суммы он не присылает, а если пришлют —
 *     схема их отбросит. Всё остальное сервер читает из БД (`computeEstimate`).
 *  3. Возвращаем только сериализуемую смету, не документы Payload.
 *  4. Ограничение частоты по IP (предпросчёт — мягче, заявка — строго) + скрытое поле-приманка.
 */
import { headers } from "next/headers";
import type { ZodError } from "zod";

import { normalizePhone, PHONE_PATTERN } from "@/lib/leads/phone";
import { acceptLead } from "@/lib/leads/record-lead";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIpFromHeaders } from "@/lib/security/request";
import { createTraceId, logServerInternalError } from "@/lib/server/internal-error";

import type { Estimate } from "./estimate";
import { formatQuantity, formatRub } from "./format";
import { calculatorInputSchema, submitSchema } from "./schema";
import { computeEstimate } from "./server";
import { UNIT_LABEL } from "./taxonomy";

export type EstimateActionResult =
  | { ok: true; estimate: Estimate }
  | { ok: false; error: string; field?: string };

export type SubmitActionResult =
  | { ok: true; total: number }
  | { ok: false; error: string; field?: string };

const GENERIC_ERROR = "Не удалось выполнить расчёт. Попробуйте ещё раз.";
const VALIDATION_ERROR = "Проверьте введённые данные.";

/** Поля, у которых сообщение zod написано для человека (остальное — технические ошибки схемы). */
const HUMAN_FIELDS = new Set(["name", "phone", "consent"]);

function describeIssue(error: ZodError): { error: string; field?: string } {
  const issue = error.issues[0];
  const field = issue?.path.length ? String(issue.path[0]) : undefined;
  return { error: field && HUMAN_FIELDS.has(field) ? issue.message : VALIDATION_ERROR, field };
}

async function limit(scope: string, maxRequests: number, windowMs: number, blockMs: number) {
  const ip = getClientIpFromHeaders(await headers());
  return checkRateLimit({ key: `${scope}:${ip}`, maxRequests, windowMs, blockMs });
}

function logFailure(error: unknown, action: string) {
  logServerInternalError({ traceId: createTraceId(), source: "server-action", error, path: `calculator/${action}` });
}

/** Предварительный расчёт для живой суммы и шага 6. Ничего не сохраняет. */
export async function calculateEstimateAction(raw: unknown): Promise<EstimateActionResult> {
  const rate = await limit("calculator-estimate", 90, 60_000, 60_000);
  if (!rate.allowed) return { ok: false, error: "Слишком много запросов. Подождите минуту." };

  const parsed = calculatorInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, ...describeIssue(parsed.error) };

  try {
    const result = await computeEstimate(parsed.data);
    return result.ok ? { ok: true, estimate: result.estimate } : { ok: false, error: result.error, field: result.field };
  } catch (error) {
    logFailure(error, "calculate");
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Текст заявки для админки и письма. Читается без форматирования. */
function describeLead(estimate: Estimate, material: string): string {
  const rows = estimate.lines.map(
    (line) =>
      `• ${line.name}: ${formatQuantity(line.quantity)} ${UNIT_LABEL[line.unit]} × ${formatRub(line.unitPrice)} = ${formatRub(line.amount)}`
  );
  return [
    `Расчёт из калькулятора (предварительный): ${formatRub(estimate.total)}`,
    `Материал: ${material || "—"}`,
    `Изделий: ${estimate.totals.itemCount}, площадь ${formatQuantity(estimate.totals.areaSqm)} м²`,
    "",
    ...rows,
    ...(estimate.warnings.length ? ["", ...estimate.warnings.map((w) => `! ${w}`)] : [])
  ].join("\n");
}

/**
 * Отправка заявки со сметой. Смета пересчитывается ЗДЕСЬ заново по идентификаторам — то, что клиент
 * видел на экране, на сохранение не влияет. В заявку пишется снимок цен на момент отправки.
 */
export async function submitEstimateAction(raw: unknown): Promise<SubmitActionResult> {
  const rate = await limit("calculator-submit", 5, 10 * 60_000, 20 * 60_000);
  if (!rate.allowed) return { ok: false, error: "Слишком много заявок. Попробуйте позже или позвоните нам." };

  // Бот заполнил скрытое поле: отвечаем «успешно», но ничего не сохраняем.
  if (typeof raw === "object" && raw !== null && typeof (raw as { website?: unknown }).website === "string" && (raw as { website: string }).website.length > 0) {
    return { ok: true, total: 0 };
  }

  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, ...describeIssue(parsed.error) };

  const { name, phone: rawPhone, consent: _consent, website: _website, ...input } = parsed.data;
  void _consent;
  void _website;

  const phone = normalizePhone(rawPhone);
  if (!PHONE_PATTERN.test(phone)) return { ok: false, error: "Проверьте номер телефона.", field: "phone" };

  try {
    const result = await computeEstimate(input);
    if (!result.ok) return { ok: false, error: result.error, field: result.field };

    const material = result.material ? `${result.material.brand} ${result.material.name}`.trim() : "";
    const message = describeLead(result.estimate, material);

    await acceptLead({
      name,
      phone,
      source: "kalkulyator",
      message,
      mail: { product: message },
      estimateTotal: result.estimate.total,
      // JSON-снимок: размеры + смета с ценами на момент заявки (цены потом могут измениться).
      estimate: JSON.parse(JSON.stringify({ input, estimate: result.estimate, material, calculatedAt: new Date().toISOString() }))
    });
    // Заявка сохранена в админке в любом случае; письмо — дополнительное уведомление.
    return { ok: true, total: result.estimate.total };
  } catch (error) {
    logFailure(error, "submit");
    return { ok: false, error: "Не удалось отправить заявку. Позвоните нам или попробуйте ещё раз." };
  }
}
