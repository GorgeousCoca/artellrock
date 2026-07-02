import { HomeAvantgarde } from "@/components/avantgarde/home-avantgarde";
import { getFaqItems, getSettings } from "@/lib/site";

export default async function HomePage() {
  const [settings, faqItems] = await Promise.all([getSettings(), getFaqItems()]);

  return <HomeAvantgarde settings={settings} faqItems={faqItems} />;
}
