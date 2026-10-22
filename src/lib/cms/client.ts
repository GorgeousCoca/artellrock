import config from "@payload-config";
import { getPayload } from "payload";

/**
 * Единственная точка получения Local API Payload. Импортируют её только модули данных:
 * `cms/store.ts` (портфолио, заявки, отзывы) и `calculator/server.ts` (справочники и материалы каталога).
 * Страницы, Route Handler'ы и компоненты к Payload напрямую не ходят.
 */
export function getPayloadClient() {
  return getPayload({ config });
}
