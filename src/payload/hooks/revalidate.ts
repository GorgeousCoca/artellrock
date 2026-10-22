import { revalidatePath, revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { cmsTag } from "../../lib/cms/tags";

/**
 * Страницы каталога кварца статические (`generateStaticParams`). Тег `cms:materials` сбрасывает
 * `unstable_cache` калькулятора и каталога, а путь — уже собранный HTML этих страниц.
 * Группа `(public)` в URL не входит; второй вызов покрывает ключ с группой, если кэш записан так.
 */
const STATIC_PAGES: Record<string, Array<{ path: string; type?: "page" }>> = {
  projects: [{ path: "/portfolio" }],
  materials: [
    { path: "/catalog-kvarca" },
    { path: "/catalog-kvarca/[brand]", type: "page" },
    { path: "/catalog-kvarca/[brand]/[decor]", type: "page" },
    { path: "/(public)/catalog-kvarca/[brand]", type: "page" },
    { path: "/(public)/catalog-kvarca/[brand]/[decor]", type: "page" }
  ]
};

/**
 * Сбрасывает кэш данных CMS (`unstable_cache` в `lib/cms/store.ts` и каталоге кварца) сразу после правки
 * в админке, чтобы публичный сайт не ждал истечения TTL.
 *
 * Вне контекста Next (скрипты `payload run`, миграции) `revalidateTag` бросает — это нормально:
 * кэша там нет, поэтому ошибку глотаем.
 */
export function invalidate(slug: string) {
  try {
    revalidateTag(cmsTag(slug), { expire: 0 });
    for (const page of STATIC_PAGES[slug] ?? []) {
      if (page.type) revalidatePath(page.path, page.type);
      else revalidatePath(page.path);
    }
  } catch {
    /* вне окружения Next кэша нет */
  }
}

/**
 * Флаг контекста Local API: `payload.update({ ..., context: { skipRevalidate: true } })` пропускает сброс кэша
 * в хуках. Нужен пакетным операциям (сотни записей подряд): они сбрасывают тег ОДИН раз в конце сами.
 */
export const SKIP_REVALIDATE_CONTEXT = "skipRevalidate";

const skipped = (context: { [key: string]: unknown } | undefined) => Boolean(context?.[SKIP_REVALIDATE_CONTEXT]);

export function revalidateCollectionAfterChange(slug: string): CollectionAfterChangeHook {
  return ({ doc, context }) => {
    if (!skipped(context)) invalidate(slug);
    return doc;
  };
}

export function revalidateCollectionAfterDelete(slug: string): CollectionAfterDeleteHook {
  return ({ doc, context }) => {
    if (!skipped(context)) invalidate(slug);
    return doc;
  };
}

/** Готовый набор хуков для публичной коллекции. */
export function revalidateHooks(slug: string) {
  return {
    afterChange: [revalidateCollectionAfterChange(slug)],
    afterDelete: [revalidateCollectionAfterDelete(slug)]
  };
}
