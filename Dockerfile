# syntax=docker.io/docker/dockerfile:1

FROM oven/bun:1.3.12-alpine AS base

# libc6-compat is commonly required for native deps on Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

FROM base AS dependencies

COPY package.json bun.lockb* bun.lock* pnpm-lock.yaml* package-lock.json* yarn.lock* .npmrc* ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    if [ -f bun.lockb ] || [ -f bun.lock ]; then \
        bun install --no-save --frozen-lockfile; \
    else \
        bun install --no-save; \
    fi

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Generate Prisma client (Prisma CLI is in devDependencies)
RUN bunx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=bun:bun /app/public ./public

# Prepare the prerender cache directory for the non-root runtime user.
RUN mkdir -p .next && chown bun:bun .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Prisma migrate deploy needs the migrations, config, and full installed modules.
COPY --from=builder --chown=bun:bun /app/prisma ./prisma
COPY --from=builder --chown=bun:bun /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/scripts/start-with-migrations.sh ./scripts/start-with-migrations.sh

RUN chmod +x /app/scripts/start-with-migrations.sh

USER bun

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENTRYPOINT ["./scripts/start-with-migrations.sh"]
CMD ["bun", "server.js"]
