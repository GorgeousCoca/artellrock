import { permanentRedirect } from "next/navigation";

/** Карточки по прямой ссылке отключены — ведём на контакты. */
export function generateStaticParams() {
  // Пустой список: при `output: "export"` не создаём сотни однотипных HTML с редиректом.
  // На `next start` / Docker маршрут обрабатывается по запросу, редирект сохраняется.
  return [];
}

export default function StoneDetailRedirect() {
  permanentRedirect("/contacts");
}
