# Lake – Agent Guide

This file is the repository-level instruction source for Codex-compatible agents working in this project.

## Architecture

- **Runtime** Next.js 16 App Router. Locale-prefixed pages live under `app/[locale]`; the root shell is `app/layout.tsx`. Locale handling uses `proxy.ts`, `i18n/routing.ts`, and `i18n/request.ts` for `de`/`en`.
- **Startup & Observability** `instrumentation.ts` runs `performVerification()` on Node startup, registers OpenTelemetry logging, and hard-fails if required env vars or seeded DB constants/resources are missing. Prefer `logger` for new server code; some startup/infra paths still use `console.*`.
- **Auth** `auth.ts` configures Better Auth with Prisma adapter, Discord + Google OAuth, email/password with required verification, 2FA, API keys, usernames, admin plugin, last-login tracking, and Turnstile captcha. Social signups provision a Pterodactyl user immediately; email/password signups defer PT provisioning until the first verified session. The auth route lives at `app/api/auth/[...all]/route.ts`; client helpers live in `lib/auth-client.ts`.
- **Database** Prisma schema lives in `prisma/schema.prisma`; the generated client is emitted to `app/client/generated` and wrapped by `lib/prisma.ts` with `PrismaPg`. In application code always import the shared client from `@/lib/prisma`.
- **Domain Models** Important tables include `GameServer`, `GameServerOrder`, `GameData`, `Location`, `CPU`, `RAM`, `Package`, `ResourceTier`, `HardwareRecommendation`, `Refund`, `SupportTicket`, `JobRun`, `WorkerLog`, `ApplicationLog`, `Email`, `KeyValue`, `BlogPost`, `ChangelogEntry`, and `Verification`. Key enums include `OrderType`, `ProvisioningStatus`, `RefundStatus`, `RefundType`, `RefundServerAction`, `TicketStatus`, `WorkerJobType`, `LogType`, and `LogLevel`.
- **Pterodactyl Integration** Admin API helpers live under `lib/Pterodactyl/ptAdminClient.ts`; user API helpers in `lib/Pterodactyl/ptUserClient.ts`; websocket helpers in `lib/Pterodactyl/webSocket.ts`; lifecycle helpers live under `lib/Pterodactyl/**`. `NEXT_PUBLIC_PTERODACTYL_URL` and per-user `session.user.ptKey` are used widely in the dashboard, file manager, console, and server actions.

## Core Workflows

- **Order Surface** The canonical order routes are `app/[locale]/order/`, `order/[gameSlug]`, `order/[gameSlug]/setup`, `order/configure`, `order/configure/games`, `order/checkout`, `order/free`, `order/free/[gameSlug]`, and `checkout/return`. There is no `booking2` route, but `components/booking2/*` are still reused inside setup, free-server, and change-game flows.
- **Checkout Actions** Paid flows go through `app/actions/checkout/checkout.ts`. `checkoutAction()` currently creates `CONFIGURED` or `UPGRADE` orders and returns a Stripe Embedded Checkout client secret. `TO_PAYED` exists in the schema/UI but is still unimplemented. The schema still carries legacy `NEW`, `PACKAGE`, and `RENEW` types, and webhook provisioning still handles them if they already exist in the database.
- **Free Tier** `checkoutFreeGameServer()` creates a `FREE_SERVER` order with `status: 'PAID'` and queues provisioning immediately; it is not Stripe-webhook-driven. Free-tier limits/config come from `lib/free-tier/config.ts` plus `KeyValue` entries like `FREE_SERVERS_LOCATION_ID`, `FREE_TIER_MAX_SERVERS`, and related constants in `app/GlobalConstants.ts`. `app/actions/gameservers/extendFreeServer.ts` handles free-server extension logic.
- **Payments & Webhooks** `components/payments/PaymentElements.tsx` only renders Stripe Embedded Checkout once a client secret exists; auth/session gating happens in the calling pages and actions. Stripe webhook handling lives in `app/webhook/route.ts` and `handleCheckoutSessionCompleted.ts`; it updates Stripe IDs, marks orders `PAID`, queues worker provisioning for `NEW`/`CONFIGURED`/`PACKAGE`, runs upgrades for `UPGRADE`, and records failures through `ProvisioningStatus`.
- **Refunds & Withdrawals** Refund logic is split between `app/actions/refunds/requestRefund.ts`, `app/actions/refunds/adminRefund.ts`, `lib/refund/refundLogic.ts`, and `lib/refund/undoRefundedOrder.ts`. The code distinguishes self-service legal withdrawal (`WITHDRAWAL`, pro-rata cancellation) from admin goodwill refunds (`REFUND`) and uses `serverAction` (`SUSPEND`, `SHORTEN`, `NONE`) to decide Pterodactyl side effects. Webhook reconciliation lives in `app/webhook/handleRefundWebhooks.ts`.
- **Gameserver Dashboard** Server pages under `app/[locale]/gameserver/**` use a mix of server actions, direct Pterodactyl client calls with `session.user.ptKey`, and websocket-backed live state. The active console stack is `ServerLoader` + `contexts/WebSocketContext.tsx` + `hooks/useServerWebSocket.ts`; `hooks/useWebSocket.ts` is a lower-level legacy hook.
- **Support / Content / Admin** Support tickets are created via `app/api/tickets/route.ts`. Admin surfaces under `app/[locale]/admin/**` cover gameservers, users, sessions, logs, API keys, refunds, key values, job status, cache invalidation, tickets, status, wings, blog, and changelog. Public content pages live under `blog`, `changelog`, `support`, `profile`, and `withdrawal`.

## Conventions & Integration

- **Server Actions** Start files with `'use server'` and retrieve the session via `auth.api.getSession({ headers: await headers() })` when auth is required.
- **Env Access** Prefer `env()` from `next-runtime-env` in runtime code. Reserve `process.env` for build-time or startup-only config such as `next.config.ts`, `prisma.config.ts`, and instrumentation/bootstrap logic.
- **Validation** Reuse schemas from `lib/validation/**` and shared types from `models/prisma.ts`, `models/config.ts`, and `types/jobs.ts` instead of inventing ad hoc shapes.
- **Logging** Prefer `logger` from `@/lib/logger` for new server/application code with `LogType` and `LogLevel`. Do not add new `console.*` calls unless you are intentionally working in startup/build/infra code where plain stdout/stderr is the right tool.
- **KeyValue Store** Runtime-managed content and config live in `KeyValue`; use `lib/keyValue.ts` and cache tags such as `keyValue` rather than hardcoding values.
- **API Routes** There is no `app/api/servers/**` tree. Current routes include `app/api/auth/[...all]`, `orders/[orderId]`, `provisioning/[jobId]`, `jobs/*`, `status`, `uptime`, `tickets`, `promExport`, and `testing`. Status/metrics routes can be protected by API key permissions via `lib/apiRouteAuth.ts`.
- **Notifications & Analytics** User emails are assembled in `lib/email/sendEmailEmailsFromLake.ts`; admin notifications use `lib/Notifications/telegram.ts`; signup/auth analytics also flow through `lib/posthog.ts`.
- **UI Patterns** Preserve the existing shadcn/Tailwind language. The `Card` component already carries responsive padding; avoid wrapping it in redundant padding/margin. When not using `Card`, default to `p-2 md:p-6`. Order and dashboard screens lean on sticky headers, sticky mobile action bars, and compact mobile layouts.

## Tooling

- **Package Manager** Use Bun only: `bun install`, `bun dev`, `bun build`, `bun start`, `bunx ...`.
- **Database & Prisma** Start Postgres with `docker compose up db`. After schema changes run `bunx prisma migrate dev --name <desc>`, `bunx prisma generate`, and `bunx prisma db seed` as needed.
- **Worker Dependency** The app expects an external worker reachable via `WORKER_IP`. `package.json` still contains `bun run worker`, but the checked-out repo currently does not include a `worker/` directory, so treat that script as external/missing unless the user provides it.
- **Required Secrets** Core runtime needs `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, Discord and Google OAuth creds, Stripe keys plus `webhookSecret`, `NEXT_PUBLIC_PTERODACTYL_URL`, `PTERODACTYL_API_KEY`, `WORKER_IP`, mail/Telegram/PostHog/OTel envs, and Turnstile keys. `instrumentation.ts` and `lib/startup.ts` fail fast if required values or seeded KeyValue records are missing.
- **Formatting** Follow the existing alias imports from `tsconfig.json` (`@/`). The repo uses Prettier, ESLint, Next.js, and Tailwind 4-era packages; prefer targeted checks for touched files before broad repo-wide commands.

## Agent Workflow

- **Project Guidance** Treat this file as the canonical repo guidance for Codex-compatible agents. `.github/copilot-instructions.md` may lag behind the live code.
- **Skills** Reusable project skills live under `.agents/skills/`. Prefer those skills when a task matches them.
- **Safety** This repository may have unrelated local changes. Do not revert user edits unless the task explicitly requires it.
- **Validation** Prefer targeted checks for the files you changed before broader repo-wide commands.
