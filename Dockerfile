# Многоэтапная сборка для Next.js приложения с nginx
FROM node:18-alpine AS base

# Установка зависимостей только для сборки
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
RUN npm ci

# Этап сборки
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Продакшн этап с nginx
FROM nginx:alpine AS runner
WORKDIR /app

# Устанавливаем Node.js для запуска Next.js сервера
RUN apk add --no-cache nodejs npm

# Копируем собранное приложение
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем public папку из исходного кода
COPY public/ ./public/

# Копируем все зависимости (включая Tailwind CSS)
COPY --from=deps /app/node_modules ./node_modules

# Копируем Prisma схему и генерируем клиент
COPY --from=builder /app/prisma ./prisma

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порты
EXPOSE 3000 80

# Создаем скрипт запуска
COPY --chown=nextjs:nodejs start.sh ./
RUN chmod +x start.sh

# Запускаем приложение
CMD ["./start.sh"]
