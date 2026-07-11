FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/tmp/yanchuaner-build.db"
ENV SESSION_SECRET="docker-build-session-secret-not-for-runtime"
ENV APP_URL="http://localhost:3000"
ENV SITE_URL="http://localhost:3000"
ENV NEXT_TELEMETRY_DISABLED="1"
RUN touch /tmp/yanchuaner-build.db \
    && npx prisma generate \
    && npx prisma migrate deploy \
    && npm run seed
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
