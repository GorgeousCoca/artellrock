/**
 * Приём заявки: один порядок действий для формы на сайте (`/api/contact`) и для калькулятора.
 *
 *  1. Сначала запись в базу. Потеря заявки при сбое почты или диска исключена: она видна в админке.
 *  2. Вложение сохраняется и дописывается в запись. Ошибка сохранения вложения пробрасывается.
 *  3. Письмо — дополнительное уведомление. Результат (`delivered` / `failed_mail`) пишется в запись;
 *     исключение при отправке не роняет приём.
 *
 * Модуль чистый: к БД, диску и SMTP ходит через `LeadPorts`. В production порты подставляет `record-lead.ts`,
 * в тестах — заглушки. Защита от ботов (приманка, лимит запросов, дубли) остаётся у входов:
 * у HTTP-маршрута и у Server Action они разные.
 */
import type { ContactMailInput } from "@/lib/email";
import type { SavedLeadAttachment } from "@/lib/leads/attachment";
import type { ContactRequest } from "@/types/content";

export type LeadDraft = {
  name: string;
  phone: string;
  telegram?: string;
  source: string;
  /** Текст заявки для админки. */
  message: string;
  /** Что попадёт в письмо: «изделие» и комментарий клиента. */
  mail: { product: string; note?: string };
  estimateTotal?: number;
  estimate?: Record<string, unknown>;
};

export type LeadPorts = {
  createRecord(input: Omit<ContactRequest, "id" | "createdAt">): Promise<{ id: string }>;
  patchRecord(
    id: string,
    patch: Partial<
      Pick<ContactRequest, "attachmentUrl" | "attachmentName" | "attachmentSize" | "deliveryStatus" | "mailError">
    >
  ): Promise<unknown>;
  sendMail(input: ContactMailInput): Promise<{ delivered: boolean; reason?: string }>;
  saveAttachment(file: File): Promise<SavedLeadAttachment>;
};

export type RecordedLead = { id: string; delivered: boolean };

export async function recordLead(ports: LeadPorts, draft: LeadDraft, file?: File | null): Promise<RecordedLead> {
  const record = await ports.createRecord({
    name: draft.name,
    phone: draft.phone,
    ...(draft.telegram !== undefined ? { telegram: draft.telegram } : {}),
    email: "",
    source: draft.source,
    message: draft.message,
    ...(draft.estimateTotal !== undefined ? { estimateTotal: draft.estimateTotal } : {}),
    ...(draft.estimate !== undefined ? { estimate: draft.estimate } : {})
  });

  let attachment: SavedLeadAttachment | null = null;
  if (file) {
    attachment = await ports.saveAttachment(file);
    await ports.patchRecord(record.id, {
      attachmentUrl: attachment.url,
      attachmentName: attachment.name,
      attachmentSize: attachment.size
    });
  }

  let delivered = false;
  try {
    const mail = await ports.sendMail({
      name: draft.name,
      phone: draft.phone,
      ...(draft.telegram !== undefined ? { telegram: draft.telegram } : {}),
      product: draft.mail.product,
      ...(draft.mail.note !== undefined ? { note: draft.mail.note } : {}),
      source: draft.source,
      attachment: attachment ? { filename: attachment.name, content: attachment.bytes } : undefined
    });
    delivered = mail.delivered;
    await ports.patchRecord(record.id, {
      deliveryStatus: mail.delivered ? "delivered" : "failed_mail",
      mailError: mail.delivered ? undefined : mail.reason
    });
  } catch {
    await ports.patchRecord(record.id, { deliveryStatus: "failed_mail", mailError: "mail-send-error" });
  }

  return { id: record.id, delivered };
}
