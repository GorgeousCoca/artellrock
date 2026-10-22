import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Явный корень — иначе Turbopack берёт родительскую папку из-за лишнего package-lock.json. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const useStandalone = process.env.NEXT_STANDALONE === "true";

/**
 * Payload CMS (админка, REST, Local API) требует Node-сервер, поэтому статический экспорт
 * (GitHub Pages / Cloudflare Pages) больше не поддерживается. Production — standalone в Docker.
 */
const nextConfig: NextConfig = {
  /** Dev-сервер отдаёт страницы через временный адрес ngrok. */
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.io", "*.ngrok.app"],
  turbopack: {
    root: projectRoot
  },
  output: useStandalone ? "standalone" : undefined,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    /** 404 для URL вне публичного сайта и Payload (у каждой группы маршрутов свой root layout). */
    globalNotFound: true
  },
  async redirects() {
    return [
      { source: "/calculator", destination: "/kalkulyator", permanent: true },
      // Старые адреса публичного сайта -> новые страницы
      { source: "/catalog", destination: "/izdeliya", permanent: true },
      { source: "/catalog/countertops", destination: "/izdeliya/stoleshnitsy", permanent: true },
      { source: "/catalog/window-sills", destination: "/izdeliya/podokonniki", permanent: true },
      { source: "/catalog/:category/:slug", destination: "/izdeliya", permanent: true },
      { source: "/catalog/:category", destination: "/izdeliya", permanent: true },
      { source: "/catalog-kamnya", destination: "/catalog-kvarca", permanent: true },
      { source: "/catalog-kamnya/brands/:brand", destination: "/catalog-kvarca/:brand", permanent: true },
      { source: "/catalog-kamnya/:group/:slug", destination: "/catalog-kvarca", permanent: true },
      { source: "/portfolio/:slug", destination: "/portfolio", permanent: true },
      { source: "/faq", destination: "/#voprosy", permanent: true },
      { source: "/privacy", destination: "/politika", permanent: true },
      { source: "/thank-you", destination: "/", permanent: true }
    ];
  },
  images: {
    remotePatterns: [],
    qualities: [60, 75, 90],
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    return [
      // `immutable` безопасен только в продакшене, где имена файлов содержат хеш содержимого.
      // В dev имена чанков стабильны: с этим заголовком браузер держит старый код после правок,
      // и страница падает с ошибкой гидратации.
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable"
                }
              ]
            }
          ]
        : []),
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

export default withPayload(nextConfig);
