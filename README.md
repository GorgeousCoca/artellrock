# Kvartsevyy Aglomerat

Корпоративный сайт на `Next.js` для демонстрации каталога изделий из искусственного камня.

## Локальный запуск

```bash
npm install
npm run dev
```

Открыть: `http://localhost:3000`

## Отправка заявок на почту

Для отправки заявок по email заполните SMTP-переменные в `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MAIL_TO`

Если SMTP не настроен, заявка сохраняется в локальном хранилище CMS, но письмо не отправляется.

## Продакшн с админкой (Docker)

GitHub Pages отдаёт только статику, поэтому **редактирование через `/admin` и API** нужно поднимать отдельно — полноценный `Next.js` на своём сервере или в контейнере.

1. Скопируйте `.env.example` в `.env` и задайте обязательные переменные:
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (в продакшене секрет обязателен, см. `src/lib/admin/auth.ts`)
   - при необходимости SMTP и `NEXT_PUBLIC_SITE_URL` (публичный URL сайта)
2. Сборка образа: `docker build -t kvartsevyy-site .`
3. Запуск: `docker compose up -d --build` (или `docker run --env-file .env -p 3000:3000 kvartsevyy-site`)

Данные CMS хранятся в `src/content/cms-store.json`, загрузки — в `public/uploads`. Чтобы они переживали пересоздание контейнера, раскомментируйте тома в `docker-compose.yml` и подготовьте файлы на хосте (см. комментарии в compose-файле).

Сборка с `NEXT_STANDALONE=true` задаётся в `Dockerfile`; локально по умолчанию по-прежнему обычный `next build` / `next start` без standalone.

## Деплой на GitHub Pages

1. Запушить проект в GitHub (ветка `main`).
2. В репозитории открыть `Settings -> Pages`.
3. В поле **Source** выбрать **GitHub Actions**.
4. После пуша в `main` выполнится workflow `.github/workflows/deploy-pages.yml`.
5. Сайт будет доступен по адресу:
   - `https://<owner>.github.io/<repo>/` для обычного репозитория
   - `https://<owner>.github.io/` если репозиторий называется `<owner>.github.io`

## Ограничения Pages-версии

- GitHub Pages публикует только статический сайт.
- Админка и API-роуты в Pages-сборке отключаются автоматически.
- Формы в Pages работают в демо-режиме (без отправки в CRM/БД).
