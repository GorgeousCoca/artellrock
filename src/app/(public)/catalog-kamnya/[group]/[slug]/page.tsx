import { permanentRedirect } from "next/navigation";

import { getStoneSamples } from "@/lib/site";

/** Отдельные карточки декоров отключены — ведём пользователя сразу на расчёт. */

export async function generateStaticParams() {
  const stones = await getStoneSamples();
  return stones.map((stone) => ({
    group: stone.stoneType,
    slug: stone.slug
  }));
}

type PageProps = {
  params: Promise<{ group: string; slug: string }>;
};

export default async function StoneDetailRedirect(_props: PageProps) {
  permanentRedirect("/calculator");
}
