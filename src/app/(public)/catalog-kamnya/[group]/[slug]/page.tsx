import { permanentRedirect } from "next/navigation";

import { getStoneSamples } from "@/lib/site";

/** Карточки по прямой ссылке отключены — ведём на контакты. */
export async function generateStaticParams() {
  const stones = await getStoneSamples();
  return stones.map((stone) => ({
    group: stone.stoneType,
    slug: stone.slug
  }));
}

export default function StoneDetailRedirect() {
  permanentRedirect("/contacts");
}
