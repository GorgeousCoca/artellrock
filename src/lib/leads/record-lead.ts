import { createContactRequest, patchContactRequest } from "@/lib/cms/store";
import { sendContactMail } from "@/lib/email";
import { saveLeadAttachment } from "@/lib/leads/attachment";
import { recordLead, type LeadDraft, type LeadPorts } from "@/lib/leads/intake";

/** Боевые порты: Payload (заявки), SMTP (письмо), `public/uploads/leads` (вложения). */
const productionPorts: LeadPorts = {
  createRecord: createContactRequest,
  patchRecord: patchContactRequest,
  sendMail: sendContactMail,
  saveAttachment: saveLeadAttachment
};

/** Принять заявку так, как это делает сайт. Единственная точка входа для формы и калькулятора. */
export function acceptLead(draft: LeadDraft, file?: File | null) {
  return recordLead(productionPorts, draft, file);
}
