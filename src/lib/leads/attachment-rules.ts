/** Как в подписи формы: jpg, png, gif, doc, xls. docx и xlsx — те же документы в новом формате. */
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx", ".xls", ".xlsx"]);

export const LEAD_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;

export type LeadAttachmentProblem = "file-type" | "file-too-large";

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "";
  return name.slice(dot).toLowerCase();
}

export function inspectLeadAttachment(file: { name: string; size: number }): LeadAttachmentProblem | null {
  if (file.size > LEAD_ATTACHMENT_MAX_BYTES) return "file-too-large";
  if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) return "file-type";
  return null;
}
