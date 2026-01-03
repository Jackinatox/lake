# Use Bun for building and running - matches dev environment
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS install
COPY worker/package.json worker/bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS build
COPY --from=install /usr/src/app/node_modules ./node_modules

# Copy Prisma schema to parent-like structure to maintain relative paths
COPY prisma/schema.prisma ../prisma/schema.prisma

# Copy worker code
COPY worker/ ./

# Generate Prisma client - this will output to ./client/generated as per schema config
RUN bunx prisma generate --schema=../prisma/schema.prisma --generator=worker

# Production stage
FROM oven/bun:1-slim AS release
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy built application and dependencies
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app ./

USER bun
EXPOSE 8080/tcp
ENTRYPOINT ["bun", "run", "index.ts"]
