import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Явный корень — иначе Turbopack берёт родительскую папку из-за лишнего package-lock.json. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const useStandalone = process.env.NEXT_STANDALONE === "true";
const [repositoryOwner = "", repositoryName = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserPagesRepo =
  repositoryOwner && repositoryName && repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`;
const basePath = isGithubActions && repositoryName && !isUserPagesRepo ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot
  },
  /** Static export for GitHub Pages; standalone image for Docker / VPS with admin + API. */
  output: isGithubActions ? "export" : useStandalone ? "standalone" : undefined,
  trailingSlash: isGithubActions,
  basePath,
  assetPrefix: basePath || undefined,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async redirects() {
    return [
      {
        source: "/calculator",
        destination: "/contacts",
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [],
    qualities: [60, 75, 90],
    unoptimized: isGithubActions,
    ...(!isGithubActions ? { formats: ["image/avif", "image/webp"] as ("image/avif" | "image/webp")[] } : {})
  },
  /** Статический экспорт (GitHub Pages) не подставляет эти заголовки в файлы — нужен CDN или self-host. */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, must-revalidate"
          }
        ]
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru; connect-src 'self' https: wss://mc.yandex.ru; frame-src 'self' https://www.google.com https://www.google.ru https://mc.yandex.ru; font-src 'self' data:; base-uri 'self'; form-action 'self'"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
