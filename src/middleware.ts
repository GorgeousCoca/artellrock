import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ASSET_EXT = new Set([
  "ico",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "avif",
  "svg",
  "gif",
  "woff2",
  "woff",
  "ttf",
  "otf",
  "mp4",
  "webm",
  "pdf",
  "json",
  "map"
]);

const SEO_EXT = new Set(["xml", "txt", "webmanifest"]);

function lastPathExt(pathname: string): string | null {
  const pathOnly = pathname.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const seg = pathOnly.split("/").pop() ?? "";
  if (!seg.includes(".")) {
    return null;
  }
  return seg.split(".").pop()?.toLowerCase() ?? null;
}

/**
 * Cache-Control для Node (`next start` / standalone).
 * `/_next/static/*` и `/_next/image` — в `next.config.ts` (matcher их не обрабатывает).
 * При `output: "export"` (GitHub Pages) middleware не выполняется — см. deploy-pages.yml.
 */
export function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  if (pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "private, no-store, must-revalidate");
    return res;
  }

  const ext = lastPathExt(pathname);
  if (ext && SEO_EXT.has(ext)) {
    res.headers.set("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
    return res;
  }

  if (ext && ASSET_EXT.has(ext)) {
    res.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return res;
  }

  res.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
