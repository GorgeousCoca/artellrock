# Kvartsevyy Aglomerat

Корпоративный сайт ArtellRock на `Next.js` + `Payload CMS` (Postgres): каталог изделий из кварцевого агломерата, портфолио, заявки.

## Архитектура

- Публичный сайт — `src/app/(public)`, SCSS, тексты и контакты — `src/content/artellrock.ts`, данные CMS — модуль `src/lib/cms/store.ts`
  (портфолио, заявки и отзывы: Payload Local API + кэш `unstable_cache` с тегами `cms:*`; материалы и справочники калькулятора: `src/lib/calculator/server.ts`;
  витрина `/catalog-kvarca`: единый модуль `src/lib/catalog/quartz-catalog.ts`; правка в админке сбрасывает кэш хуками `src/payload/hooks`).
- Админка Payload — `/admin`, REST — `/api/<collection>` (`src/app/(payload)`).
- Конфиг и схема: `src/payload.config.ts`, `src/payload/collections`.
- Схема БД меняется **только миграциями** (`src/migrations`), в production они применяются при старте сервера.
- Изображения каталога лежат в `public/` и в записях хранятся как URL; новые файлы можно загрузить в разделе «Медиа» (`public/uploads`) и вставить URL в поле.
- Статика посещений — `src/content/analytics.json` (виджет на дашборде админки).

## Локальный запуск

```bash
npm install
cp .env.example .env            # задайте PAYLOAD_SECRET, при желании SMTP_*
docker compose up -d postgres   # Postgres на 127.0.0.1:5432
npm run payload:migrate         # применить схему
npm run admin:create           # создать администратора (ADMIN_CREATE_EMAIL / ADMIN_CREATE_PASSWORD)
npm run dev
```

Сайт: `http://localhost:3000`, админка: `http://localhost:3000/admin`.
Первого администратора создайте на `/admin` (Payload входит по **email**) либо командой `npm run admin:create`.

### Команды Payload

| Команда | Назначение |
| --- | --- |
| `npm run payload:migrate:create -- <name>` | сгенерировать миграцию после правки коллекций |
| `npm run payload:migrate` | применить миграции к БД из `DATABASE_URI` |
| `npm run payload:types` | обновить `src/payload-types.ts` |
| `npm run payload:importmap` | обновить import map админки (после добавления кастомных компонентов) |
| `npm run admin:create           # создать администратора (ADMIN_CREATE_EMAIL / ADMIN_CREATE_PASSWORD)

## Отправка заявок на почту

Заполните SMTP-переменные в `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_TO`.
Если SMTP не настроен, заявка всё равно сохраняется в коллекции «Заявки» (`contact-requests`), письмо не отправляется.

## Продакшн (Docker)

1. Скопируйте `.env.example` в `.env` и задайте: `PAYLOAD_SECRET`, `POSTGRES_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, SMTP.
2. `docker compose up -d --build` — поднимутся Postgres и сайт; схема применится автоматически.
3. Администратор: `docker compose --profile tools run --rm -e ADMIN_CREATE_EMAIL=... -e ADMIN_CREATE_PASSWORD=... tools npm run admin:create`.

Данные: Postgres — `./data/postgres`, загрузки — `./data/uploads`. Эти каталоги нужно бэкапить.
Healthcheck: `GET /api/health` (liveness), `GET /api/health?deep=1` (проверка БД).

## Ограничения

- Статический экспорт (GitHub Pages / Cloudflare Pages) больше не поддерживается: Payload требует Node-сервер и Postgres.
- Публичные страницы рендерятся на запросе (`force-dynamic`), так как БД недоступна во время `next build`.
