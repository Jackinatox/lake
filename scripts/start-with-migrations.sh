#!/bin/sh
set -eu

if [ "${PRISMA_SKIP_MIGRATIONS:-0}" = "1" ]; then
    echo "Skipping Prisma migrations because PRISMA_SKIP_MIGRATIONS=1"
    exec "$@"
fi

max_retries="${PRISMA_MIGRATE_MAX_RETRIES:-10}"
retry_delay="${PRISMA_MIGRATE_RETRY_DELAY_SECONDS:-5}"
attempt=1

while true; do
    if bun ./node_modules/prisma/build/index.js migrate deploy --config ./prisma.config.ts; then
        break
    fi

    if [ "$attempt" -ge "$max_retries" ]; then
        echo "Prisma migrations failed after ${attempt} attempts" >&2
        exit 1
    fi

    echo "Prisma migrations failed on attempt ${attempt}/${max_retries}. Retrying in ${retry_delay}s..." >&2
    attempt=$((attempt + 1))
    sleep "$retry_delay"
done

exec "$@"
