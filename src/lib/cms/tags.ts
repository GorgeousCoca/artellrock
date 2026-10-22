/**
 * Теги кэша данных CMS. Используются и чтением (`store.ts`, `unstable_cache`),
 * и хуками Payload (`payload/hooks/revalidate.ts`), которые сбрасывают кэш при правках в админке.
 * Без импортов Next/Payload — безопасно подключать откуда угодно.
 */

/** Страховочный TTL кэша данных: основная актуализация идёт через теги. */
export const CMS_CACHE_TTL_SECONDS = 60 * 60;

export function cmsTag(slug: string) {
  return `cms:${slug}`;
}