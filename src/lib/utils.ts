export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

/** Показываем цену в каталоге только если задана явная положительная ₽/м² (0 и отсутствие — «по запросу»). */
export function hasListedPricePerSqm(value: number | null | undefined): value is number {
  return typeof value === "number" && value > 0;
}

export function slugToTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Базовый path для GitHub Pages / кастомного хостинга (совпадает с `next.config` `basePath`). */
export function getConfiguredBasePath(): string {
  const [repositoryOwner = "", repositoryName = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
  const isUserPagesRepo =
    repositoryOwner && repositoryName && repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`;
  const inferredBasePath = repositoryName && !isUserPagesRepo ? `/${repositoryName}` : "";
  return process.env.NEXT_PUBLIC_BASE_PATH ?? inferredBasePath;
}

/**
 * Путь к файлу из `public/` для `<img>`, `<video>`, `poster` и т.п., если задан `basePath` (GitHub Pages).
 * Без basePath возвращает путь с ведущим `/`.
 */
export function publicAssetPath(path: string): string {
  const bp = getConfiguredBasePath().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!bp) {
    return normalized;
  }
  if (normalized === bp || normalized.startsWith(`${bp}/`)) {
    return normalized;
  }
  return `${bp}${normalized}`;
}

/** Origin для абсолютных URL (OG, sitemap, JSON-LD). В production задайте NEXT_PUBLIC_SITE_URL при сборке образа. */
function siteOriginForAbsoluteUrls(): string {
  const trimmed = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (trimmed) {
    return trimmed;
  }
  return process.env.NODE_ENV === "production" ? "https://artellrock.ru" : "http://localhost:3000";
}

/** Корень сайта для `metadataBase` в Next.js (OG и canonical с полным доменом). */
export function getMetadataBaseUrl(): URL {
  const base = siteOriginForAbsoluteUrls();
  const bp = getConfiguredBasePath();
  if (!bp) {
    return new URL("/", base);
  }
  const normalized = bp.startsWith("/") ? bp : `/${bp}`;
  return new URL(`${normalized.replace(/\/$/, "")}/`, base);
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = siteOriginForAbsoluteUrls();
  const configuredBasePath = getConfiguredBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withBasePath =
    configuredBasePath && !normalizedPath.startsWith(configuredBasePath)
      ? `${configuredBasePath}${normalizedPath}`
      : normalizedPath;

  return new URL(withBasePath, base).toString();
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function excerptText(text: string, maxLength = 160) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}
