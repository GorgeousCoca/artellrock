# Production image: full Next.js (admin, API, file-based CMS). Not for GitHub Pages static export.
# Build: docker build -t kvartsevyy-site .
# Run:  docker run --env-file .env -p 3000:3000 kvartsevyy-site
#
# NEXT_PUBLIC_SITE_URL — задайте при сборке (build-arg), иначе OG/canonical/JSON-LD укажут на неверный хост.
# Пример: docker build --build-arg NEXT_PUBLIC_SITE_URL=https://artellrock.ru -t kvartsevyy-site .

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm i -g npm@11.16.0
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=true
# Канонический URL (без слэша в конце). Переопределите: --build-arg NEXT_PUBLIC_SITE_URL=https://ваш-домен
ARG NEXT_PUBLIC_SITE_URL=https://artellrock.ru
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/content ./src/content

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
