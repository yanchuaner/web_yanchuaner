FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
ARG NPM_CONFIG_PROXY
ARG NPM_CONFIG_HTTPS_PROXY
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund \
    --fetch-retries=4 \
    --fetch-retry-mintimeout=10000 \
    --fetch-retry-maxtimeout=60000

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
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

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
