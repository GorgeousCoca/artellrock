/** Базовый path для GitHub Pages / кастомного хостинга (совпадает с `next.config` `basePath`). */
function getConfiguredBasePath(): string {
  const [repositoryOwner = "", repositoryName = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
  const isUserPagesRepo =
    repositoryOwner && repositoryName && repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`;
  const inferredBasePath = repositoryName && !isUserPagesRepo ? `/${repositoryName}` : "";
  return process.env.NEXT_PUBLIC_BASE_PATH ?? inferredBasePath;
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

/** Обрезает сниппет по границе слова, чтобы описание не обрывалось на полуслове. */
export function excerptText(text: string, maxLength = 160) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength - 1);
  const cut = slice.lastIndexOf(" ");
  const base = (cut > 40 ? slice.slice(0, cut) : slice).trim();
  return `${base}…`;
}
