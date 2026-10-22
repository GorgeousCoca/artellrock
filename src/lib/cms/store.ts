import { unstable_cache } from "next/cache";

import { getPayloadClient } from "@/lib/cms/client";
import { CMS_CACHE_TTL_SECONDS, cmsTag } from "@/lib/cms/tags";
import type { ContactRequest, Project, Testimonial } from "@/types/content";

/**
 * Модуль данных для портфолио, заявок и отзывов (адаптер: Payload CMS, Postgres).
 * Публичный сайт работает с доменными типами из `@/types/content`, а не с документами Payload.
 *
 * Справочники и материалы калькулятора/каталога читает `lib/calculator/server.ts`; тексты и контакты
 * компании лежат в `src/content/artellrock.ts`.
 */

type DocKey = "projects" | "contactRequests" | "testimonials";

type DocMap = {
  projects: Project;
  contactRequests: ContactRequest;
  testimonials: Testimonial;
};

/** Поля, которые в типах всегда массивы (в БД у пустых hasMany может быть null). */
const arrayFields: Partial<Record<DocKey, string[]>> = {
  projects: ["gallery", "productRefs"]
};

/** Документы, у которых `createdAt` является частью доменного типа. */
const keepCreatedAt = new Set<DocKey>(["testimonials", "contactRequests"]);

function normalize<K extends DocKey>(key: K, doc: Record<string, unknown>): DocMap[K] {
  const result: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(doc)) {
    if (field === "updatedAt" || field === "_status") continue;
    if (field === "createdAt" && !keepCreatedAt.has(key)) continue;
    if (value === null) continue;
    result[field] = field === "id" ? String(value) : value;
  }

  for (const field of arrayFields[key] ?? []) {
    if (!Array.isArray(result[field])) {
      result[field] = [];
    }
  }

  return result as DocMap[K];
}

function toPayloadId(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id;
}

/**
 * Проекты кэшируются (`unstable_cache`) с тегом коллекции: страницы рендерятся на запросе,
 * но в Postgres ходят только после правки в админке (хуки `payload/hooks/revalidate.ts` сбрасывают тег)
 * или по истечении страховочного TTL. Заявки содержат персональные данные и не кэшируются.
 */
async function fetchProjects(): Promise<Project[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: "projects", depth: 0, limit: 0, pagination: false });

  return result.docs.map((doc) => normalize("projects", doc as unknown as Record<string, unknown>));
}

export const listProjects = unstable_cache(fetchProjects, ["cms-list", "projects"], {
  tags: [cmsTag("projects")],
  revalidate: CMS_CACHE_TTL_SECONDS
});

export async function createContactRequest(input: Omit<ContactRequest, "id" | "createdAt">) {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "contact-requests",
    data: input,
    depth: 0
  });

  return normalize("contactRequests", doc as unknown as Record<string, unknown>);
}

export async function patchContactRequest(
  id: string,
  patch: Partial<
    Pick<
      ContactRequest,
      "attachmentUrl" | "attachmentName" | "attachmentSize" | "deliveryStatus" | "mailError"
    >
  >
) {
  const payload = await getPayloadClient();

  try {
    const doc = await payload.update({
      collection: "contact-requests",
      id: toPayloadId(id),
      data: patch,
      depth: 0
    });
    return normalize("contactRequests", doc as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Только одобренные отзывы, новые сверху. Тег сбрасывается, когда администратор меняет отзыв. */
async function fetchApprovedTestimonials(): Promise<Testimonial[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "testimonials",
    where: { status: { equals: "approved" } },
    sort: "-createdAt",
    depth: 0,
    limit: 0,
    pagination: false
  });

  return result.docs.map((doc) => normalize("testimonials", doc as unknown as Record<string, unknown>));
}

export const listApprovedTestimonials = unstable_cache(fetchApprovedTestimonials, ["cms-list", "testimonials-approved"], {
  tags: [cmsTag("testimonials")],
  revalidate: CMS_CACHE_TTL_SECONDS
});

/** Создание записи с публичного сайта (отзыв со статусом `pending`). */
export async function createTestimonial(data: Omit<Testimonial, "id" | "createdAt">) {
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "testimonials",
    data,
    depth: 0
  });

  return normalize("testimonials", doc as unknown as Record<string, unknown>);
}

/** Проверка связи с БД для `/api/health?deep=1`: бросает, если Postgres недоступен. */
export async function pingDatabase() {
  const payload = await getPayloadClient();
  await payload.count({ collection: "projects" });
}
