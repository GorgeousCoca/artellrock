/**
 * Обёртки для вызовов `/api/*` из браузера.
 *
 * **Сервер (RSC / route handlers)** — для кэшируемых GET используйте нативный `fetch` с
 * `{ next: { revalidate: секунды } }` или `cache: "force-cache"` по документации Next.js.
 *
 * **Клиент** — HTTP `Cache-Control` на ответе API задаётся в `middleware.ts` / `next.config.ts`
 * (`no-store` для `/api/*`). В `fetch` дополнительно задавайте `cache: "no-store"`, иначе
 * браузер может иначе интерпретировать повторные GET.
 *
 * Для **stale-while-revalidate на клиенте** по данным (не по заголовку ответа) подключите
 * SWR или TanStack Query: `staleTime` имитирует «свежий» интервал, фоновый рефетч — SWR.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    cache: init?.cache ?? "no-store"
  });
}
