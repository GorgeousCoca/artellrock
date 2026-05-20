import type { Product, ProductType, StoneSample, StoneType } from "@/types/content";

export type CatalogSearchParams = {
  type?: string;
  material?: string;
  color?: string;
  sort?: string;
  page?: string;
};

export function filterProducts(products: Product[], params: CatalogSearchParams) {
  let filtered = [...products];

  if (params.type) {
    filtered = filtered.filter((item) => item.type === params.type);
  }

  if (params.material) {
    filtered = filtered.filter((item) => item.material === params.material);
  }

  if (params.color) {
    filtered = filtered.filter((item) => item.color === params.color);
  }

  switch (params.sort) {
    case "price-asc":
      filtered.sort((a, b) => a.basePrice - b.basePrice);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.basePrice - a.basePrice);
      break;
    case "newest":
      filtered.reverse();
      break;
    default:
      filtered.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }

  return filtered;
}

export function filterStoneSamples(
  stones: StoneSample[],
  params: { type?: string; color?: string; texture?: string; manufacturer?: string }
) {
  return stones.filter((item) => {
    return (
      (!params.type || item.stoneType === params.type) &&
      (!params.color || item.color === params.color) &&
      (!params.texture || item.texture === params.texture) &&
      (!params.manufacturer || item.manufacturer === params.manufacturer)
    );
  });
}

export function paginate<T>(items: T[], page = 1, perPage = 6) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    totalPages
  };
}

export const productTypeLabels: Record<ProductType, string> = {
  countertops: "Столешницы",
  "window-sills": "Подоконники",
  sinks: "Мойки и раковины",
  profiles: "Профили"
};

export const stoneTypeLabels: Record<StoneType, string> = {
  quartz: "Кварц",
  acrylic: "Акриловый камень",
  marble: "Мрамор",
  granite: "Гранит"
};
