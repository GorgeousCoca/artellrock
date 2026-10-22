import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ru } from "@payloadcms/translations/languages/ru";
import { buildConfig } from "payload";
import sharp from "sharp";

import { migrations } from "./migrations";
import { AdditionalServices } from "./payload/collections/additional-services";
import { Backsplashes } from "./payload/collections/backsplashes";
import { ContactRequests } from "./payload/collections/contact-requests";
import { Edges } from "./payload/collections/edges";
import { Materials } from "./payload/collections/materials";
import { Media } from "./payload/collections/media";
import { Projects } from "./payload/collections/projects";
import { Sinks } from "./payload/collections/sinks";
import { Testimonials } from "./payload/collections/testimonials";
import { Users } from "./payload/collections/users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname)
    },
    components: {
      beforeDashboard: ["/payload/components/visit-stats"],
      // Ссылка «Цены на камни» в боковом меню и сама страница (массовое редактирование цен калькулятора).
      afterNavLinks: ["/payload/components/stone-prices-nav-link#StonePricesNavLink"],
      views: {
        stonePrices: {
          Component: "/payload/views/stone-prices#StonePricesView",
          path: "/stone-prices",
          meta: { title: "Цены на камни" }
        }
      }
    },
    meta: {
      titleSuffix: " — ArtellRock",
      robots: "noindex, nofollow"
    }
  },
  // Тексты, FAQ, телефоны и контакты компании живут в `src/content/artellrock.ts` (один источник).
  // Здесь только то, что меняется в админке: портфолио, отзывы, заявки и справочники калькулятора.
  collections: [
    Projects,
    Testimonials,
    ContactRequests,
    Materials,
    Edges,
    Backsplashes,
    Sinks,
    AdditionalServices,
    Media,
    Users
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || ""
    },
    // Схема меняется только миграциями (`npm run payload:migrate:create`, `npm run payload:migrate`).
    push: false,
    // В production схема применяется миграциями из src/migrations при старте сервера.
    prodMigrations: migrations
  }),
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: "ru"
  },
  upload: {
    limits: { fileSize: 8 * 1024 * 1024 }
  },
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});
