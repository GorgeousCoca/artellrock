import { SiteNotFound } from "@/components/errors/site-not-found";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Страница не найдена — ArtellRock",
  description: "Запрашиваемая страница отсутствует или ссылка устарела.",
  skipCanonical: true,
  noIndex: true
});

export default function NotFound() {
  return <SiteNotFound />;
}
