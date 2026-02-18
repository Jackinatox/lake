# syntax=docker.io/docker/dockerfile:1

FROM oven/bun:1.3.9-alpine AS base

# libc6-compat is commonly required for native deps on Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps

# Copy manifests/lockfiles for better layer caching.
COPY package.json bun.lockb* bun.lock* pnpm-lock.yaml* package-lock.json* yarn.lock* .npmrc* ./

# If a Bun lockfile exists, enforce it; otherwise allow Bun to resolve deps.
RUN \
  if [ -f bun.lockb ] || [ -f bun.lock ]; then bun install --frozen-lockfile; \
  else bun install; \
  fi


# Rebuild the source code only when needed
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (Prisma CLI is in devDependencies)
RUN bunx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build


# Production image, copy all the files and run next
FROM base AS runner

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["bun", "server.js"]