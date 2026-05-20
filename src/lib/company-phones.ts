import type { CompanySettings } from "@/types/content";

export function getCompanyPhones(settings: CompanySettings) {
  const phones = [settings.phone, settings.secondaryPhone].filter((value): value is string => Boolean(value?.trim()));
  return Array.from(new Set(phones));
}

export function formatCompanyPhones(settings: CompanySettings) {
  return getCompanyPhones(settings).join(" / ");
}

export function getPrimaryCompanyPhone(settings: CompanySettings) {
  return getCompanyPhones(settings)[0] ?? "";
}

export function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
