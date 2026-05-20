import { HomeAvantgarde } from "@/components/avantgarde/home-avantgarde";
import { getHomeFeaturedProducts, getSettings } from "@/lib/site";

const workflow = [
  "Обсуждаем задачу, изделие и желаемый бюджет.",
  "Выезжаем на точный замер и согласуем техническое решение.",
  "Подбираем материал, профиль и комплект дополнительных опций.",
  "Изготавливаем изделие на производстве с контролем качества.",
  "Доставляем и монтируем в согласованное время."
];

export default async function HomePage() {
  const [settings, featuredProducts] = await Promise.all([getSettings(), getHomeFeaturedProducts()]);

  return (
    <HomeAvantgarde settings={settings} featuredProducts={featuredProducts} workflow={workflow} />
  );
}
