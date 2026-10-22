# Архитектура сайта ArtellRock

Перенос принципов из [bany-k-dache-architecture.md](./bany-k-dache-architecture.md) (по статье AWG «Архитектура сайта: основы проектирования для стабильной работы и роста») на текущий сайт ArtellRock.

Стек не меняется: Next.js + SCSS, контент в Payload CMS (Postgres) — миграция с JSON CMS уже идёт. Принцип «модульный монолит, а не микросервисы» остаётся: каталог — десятки позиций, а не 100 тысяч SKU.

## 1. Информационная архитектура

### Карта сайта (фактическая)

```
/                                         Главная
├── /catalog                              Каталог изделий (хаб)
│   └── /catalog/[category]               countertops | window-sills | sinks (лендинги категорий)
│       └── /catalog/[category]/[slug]    Карточка изделия (Product)
├── /catalog-kamnya                       Каталог камня (кварцевый агломерат)
│   ├── /catalog-kamnya/brands/[brand]    Страница бренда
│   └── /catalog-kamnya/[group]/[slug]    Карточка декора
├── /portfolio                            Портфолио и отзывы
│   └── /portfolio/[slug]                 Проект (CreativeWork)
├── /faq                                  Вопросы и ответы (FAQPage)
├── /about                                О компании
├── /contacts                             Контакты и форма заявки
├── /privacy                              Политика конфиденциальности
└── /thank-you                            Подтверждение заявки (noindex)
```

Структура иерархическая, URL читаемые, без ID и параметров, один канонический адрес на страницу (`buildMetadata` → `alternates.canonical`). Это уже соответствует правилам из статьи, поэтому URL **не меняем** (смена URL без необходимости ломает индексацию).

### Навигация и перелинковка
- Хлебные крошки на всех страницах глубже главной + разметка `BreadcrumbList` (добавлено, см. раздел 3).
- Путь до заявки: любая страница → `/contacts` или модалка консультации (`consultation-modal`) — 1 клик.
- Путь до конкретного изделия: главная → категория → карточка — 2–3 клика.

## 2. Техническая архитектура

```
Браузер
   │
   ▼
Caddy (TLS, сжатие, прокси)  ── Caddyfile
   │
   ▼
Next.js (standalone, Docker)
   ├── (public)  публичные страницы: рендер на запросе, данные из кэша
   ├── (payload) /admin и REST /api/[...slug] — Payload CMS
   ├── /api/contact   приём заявок
   ├── /api/reviews   приём отзывов (на модерацию)
   ├── /api/health    liveness / readiness (?deep=1 проверяет БД)
   └── /api/track-visit  аналитика посещений
   │
   ▼
Модули данных  lib/cms/store.ts · lib/calculator/server.ts · lib/catalog/quartz-catalog.ts  (кэш unstable_cache + теги)
   │
   ▼
Payload Local API ──► PostgreSQL            (контент + заявки)
                  └─► public/uploads        (загрузки, том Docker)
```

### Слои и ответственность

| Слой | Где | Ответственность |
|---|---|---|
| Представление | `src/app/(public)`, `src/components` | Только отображение, без запросов к БД напрямую |
| Доступ к данным | `src/lib/cms/store.ts` (портфолио, заявки, отзывы), `src/lib/calculator/server.ts` (материалы, справочники), `src/lib/catalog/quartz-catalog.ts` (витрина каталога) | Единственные места, где читается Payload (клиент — `src/lib/cms/client.ts`); тексты и контакты компании — `src/content/artellrock.ts` |
| CMS и модель данных | `src/payload/**`, `src/payload.config.ts` | Коллекции, права доступа, SEO-поля, хуки |
| Лиды | `src/app/api/contact`, `src/lib/leads`, `src/lib/email.ts` | Валидация, антиспам, сохранение, уведомление |
| SEO | `src/lib/seo/*`, `sitemap.ts`, `robots.ts` | Метаданные, JSON-LD, индексация |
| Безопасность | `src/lib/security/*`, заголовки в `next.config.ts`, `middleware.ts` | Rate limit, CSP, X-Frame-Options |

### Критический поток: заявка
1. Форма → `POST /api/contact` (zod, honeypot `website`, `botCheck`, rate limit по IP, дедупликация).
2. **Сначала запись в БД** (`createContactRequest` внутри `src/lib/leads/intake.ts`, общий для формы и калькулятора), затем вложение и письмо — потеря заявки при сбое SMTP исключена (статус `failed_mail`, заявка видна в админке).
3. Ответ клиенту; при сбое почты возвращается `201` с `warning`.

### Кэш и актуальность контента
Страницы остаются динамическими (`force-dynamic` в `(public)/layout.tsx`): во время `next build` в Docker нет Postgres. Чтобы это не означало «запрос к БД на каждый хит» (в статье — TTFB 200–300 мс):

- чтение данных идёт через `unstable_cache` с тегами `cms:<collection>` и TTL 1 час (`lib/cms/store.ts`, `lib/cms/tags.ts`);
- хуки Payload (`payload/hooks/revalidate.ts`) сбрасывают тег сразу после сохранения/удаления в админке — правка видна на сайте без ожидания TTL;
- заявки (`contactRequests`) не кэшируются, это персональные данные.

## 3. Что внесено в код в рамках переноса

| Изменение | Файлы | Зачем (из статьи) |
|---|---|---|
| Кэш слоя данных с тегами | `src/lib/cms/store.ts`, `src/lib/cms/tags.ts` | Время ответа (TTFB), разгрузка БД |
| Сброс кэша из CMS | `src/payload/hooks/revalidate.ts`, хуки во всех публичных коллекциях | Актуальность контента без перезапуска |
| Liveness/readiness | `src/app/api/health/route.ts`, `healthcheck` в `docker-compose.yml` | Мониторинг и отказоустойчивость |
| `BreadcrumbList` JSON-LD, `aria-current`, метка «Мойки», удалены метки админки | `src/lib/seo/schema.ts`, `src/components/ui/breadcrumbs.tsx` | Понятная иерархия для роботов и пользователей |
| `/thank-you` → `noindex` | `src/app/(public)/thank-you/page.tsx` | Служебная страница не должна попадать в выдачу |

> Проверка типов и сборки не выполнялась: `node_modules` в момент работы был в процессе установки Payload/Next (`npm i`). После завершения установки: `npm run typecheck`, `npm run lint`, затем `docker compose up -d --build` и проверка `GET /api/health?deep=1`.
> В `revalidateTag(tag, { expire: 0 })` второй аргумент — сигнатура Next 16; если после обновления версия иная, поправить в `payload/hooks/revalidate.ts`.

## 4. Резерв (не сделано, по приоритету)

1. **`lastmod` в sitemap** — нужен `updatedAt` из Payload (сейчас `normalize` его отбрасывает).
2. **Полноценный ISR** вместо `force-dynamic`: когда сборка в CI получит доступ к БД (или страницы перейдут на `generateStaticParams` с пустым результатом без БД) — вернёт TTFB на уровень статики.
3. **Уведомления о заявках в Telegram** (и/или CRM) как второй канал к SMTP; хранение дедупликации и rate limit в БД/Redis, если сайт станет больше одного экземпляра.
4. **Страницы процесса работы** («Как заказать», «Замер и монтаж», «Сроки») — отдельные URL под коммерческие запросы; потребуют контента от заказчика.
5. **JSON-LD:** `AggregateRating`/`Review` для одобренных отзывов, `WebSite`, `ImageObject`; поле `updatedAt` для `Product`.
6. **Нагрузочный тест формы и каталога (k6)** и бюджеты Core Web Vitals в CI (`a11y:lighthouse` уже есть).
7. **Бэкапы Postgres** (ежедневно) и `public/uploads` (версионирование) + проверка восстановления.
8. **Cookie-политика и баннер до загрузки Метрики** (Phase 6 в планах проекта) — условие 152-ФЗ.
