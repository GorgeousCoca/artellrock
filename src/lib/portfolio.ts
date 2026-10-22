import { portfolioCaptions } from "@/content/portfolio-captions";
import { portfolioCases } from "@/content/portfolio-cases";
import { works, type Work } from "@/content/works";
import { listProjects } from "@/lib/cms/store";
import type { Project } from "@/types/content";

/**
 * Единый модуль портфолио: все страницы берут кадры (`Work`) только отсюда.
 *  - `/portfolio` читает коллекцию Payload `projects` (правится в админке): `loadPortfolioWorks`.
 *  - Главная, блок «проект» и страницы изделий показывают подобранные кадры из `content/works.ts`.
 *    Эти страницы статические и от БД при сборке не зависят — поэтому читают файл: `worksByIds`, `worksMatching`.
 */
export type { Work };

/** Кадры из файла по списку id: порядок списка сохраняется, неизвестные id пропускаются. */
export function worksByIds(ids: readonly string[]): Work[] {
  return ids.map((id) => works.find((work) => work.id === id)).filter((work): work is Work => Boolean(work));
}

/** Кадры из файла, подходящие под условие. */
export function worksMatching(predicate: (work: Work) => boolean): Work[] {
  return works.filter(predicate);
}

/** Подпись кадра по пути картинки (для чипа на слайде). */
export function workLabelForImage(src: string): string | undefined {
  return works.find((work) => work.image === src)?.label;
}

export const PORTFOLIO_GROUPS = [
  "Столешницы",
  "Фартуки",
  "Барные стойки",
  "Острова",
  "Подоконники",
  "Стеновые панели",
  "Столы",
  "Полки"
] as const;

export type PortfolioGroup = (typeof PORTFOLIO_GROUPS)[number];

/** Раздел карточки: точное имя раздела или слово в подписи изделия. */
export function portfolioGroup(label: string): PortfolioGroup {
  const exact = PORTFOLIO_GROUPS.find((group) => group.toLowerCase() === label.trim().toLowerCase());
  if (exact) return exact;

  const value = label.toLowerCase();
  if (value.includes("фартук")) return "Фартуки";
  if (value.includes("подоконник")) return "Подоконники";
  if (value.includes("остров")) return "Острова";
  if (value.includes("панел")) return "Стеновые панели";
  if (value.includes("барн")) return "Барные стойки";
  if (value.includes("полк")) return "Полки";
  if (value.includes("стол") && !value.includes("столешниц")) return "Столы";
  return "Столешницы";
}

/** Кадры, с которых собирается портфолио: новые кейсы, затем фото из PHOTOS.md. */
export function portfolioSourceWorks(): Work[] {
  return [...portfolioCases, ...works];
}

/** Если у кадра нет текста, подставляет подпись в тоне соседних карточек. */
function applyPortfolioCaption(work: Work): Work {
  if (work.text?.trim()) return work;

  const caption = portfolioCaptions[work.id];
  if (!caption) return work;

  const titleIsLabel = !work.title || work.title === caption.label;

  return {
    ...work,
    title: titleIsLabel ? caption.title : work.title,
    text: caption.text
  };
}

function projectToWork(project: Project): Work | null {
  const image = project.afterImage || project.gallery[0];
  if (!image) return null;

  return {
    id: project.slug,
    image,
    label: portfolioGroup(project.category || project.title),
    title: project.title,
    text: project.summary || project.description || undefined
  };
}

/**
 * Карточки /portfolio в порядке поля «Порядок». Пока в админке нет ни одного проекта
 * (сидер не запускали), показываем кадры из файла, чтобы страница не была пустой.
 */
export async function loadPortfolioWorks(): Promise<Work[]> {
  const projects = await listProjects();
  const fromCms = [...projects]
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map(projectToWork)
    .filter((work): work is Work => work !== null);

  const source =
    fromCms.length > 0
      ? fromCms
      : portfolioSourceWorks().map((work) => ({ ...work, label: portfolioGroup(work.label) }));

  return source.map(applyPortfolioCaption);
}

export function groupPortfolio(items: readonly Work[]) {
  const buckets = new Map<string, Work[]>(PORTFOLIO_GROUPS.map((label) => [label, []]));

  for (const work of items) {
    buckets.get(work.label)?.push(work);
  }

  return PORTFOLIO_GROUPS.filter((label) => (buckets.get(label)?.length ?? 0) > 0).map((label) => ({
    label,
    items: buckets.get(label) ?? []
  }));
}
