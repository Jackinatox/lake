# Lake – Agent Guide

This file is the repository-level instruction source for Codex-compatible agents working in this project.

## Architecture

- **App Router** Next.js 15 app directory with locale-aware routing under `app/[locale]`; `middleware.ts` and `i18n/request.ts` enforce `de`/`en` locales and load `messages/*.json`.
- **Auth** `auth.ts` configures Better Auth with Prisma adapter plus Discord **and Google** OAuth; user creation hooks provision a Pterodactyl account via `createPtClient()` and `createUserApiKey()`. Also supports email/password with email verification, 2FA, and admin impersonation.
- **Database** Postgres via Prisma (`prisma/schema.prisma`); always import the shared client from `@/lib/prisma` inside server actions, route handlers, and data-access helpers.
- **Domain Models** Core tables: `GameServer`, `GameServerOrder`, `Location`, `GameData`, `Package`, `Refund`, `KeyValue`; enums like `OrderStatus`, `OrderType`, `GameServerType`, and `GameServerStatus` drive provisioning state and pricing logic.
- **UI Stack** Tailwind + shadcn components (`components/ui/*`) with locale-aware pages; global layout loads `Navbar`, `Footer`, theme provider, and `NextIntlClientProvider`.

## Core Workflows

- **Booking Flow** There is no `booking2` route. The order entrypoint is `app/[locale]/order/`. Free server booking lives at `app/[locale]/order/free/[gameSlug]/`. After configuration, the client calls `checkoutAction` or `checkoutFreeGameServer` in `app/actions/checkout/checkout.ts`.
- **Order Types** `NEW`, `UPGRADE`, `RENEW`, `PACKAGE`, `FREE_SERVER`, `TO_PAYED` (unimplemented), `DOWNGRADE` (planned).
- **Payment UI** `components/payments/PaymentElements.tsx` renders Stripe Embedded Checkout once the client secret arrives; gating is handled with `authClient.useSession()`.
- **Provisioning** Stripe webhook handler (`app/webhook/route.ts`) verifies signatures, marks orders `PAID`, and delegates to `lib/Pterodactyl/createServers/provisionServer.ts` (NEW/FREE_SERVER/PACKAGE) or `lib/Pterodactyl/upgradeServer/upgradeServer.ts` (UPGRADE). Refund webhooks are handled in `app/webhook/handleRefundWebhooks.ts`.
- **Free Tier** `lib/free-tier/config.ts` holds cached tier config; `lib/freeServer.ts` checks eligibility and sends notifications. Free servers use a dedicated location (`FREE_SERVERS_LOCATION_ID` key in KeyValue store).
- **Refunds** `lib/refund/refundLogic.ts` and `lib/refund/undoRefundedOrder.ts`; refund actions in `app/actions/refunds/`. Webhook events: `charge.refunded`, `refund.updated`, `refund.failed`, `charge.dispute.created`.
- **Pterodactyl Admin Calls** Admin-facing actions (e.g. `app/actions/gameservers/deleteGameServers.ts`) use `env("PTERODACTYL_API_KEY")` with `createPtClient()` to mutate servers.
- **Pricing & Limits** `lib/GlobalFunctions/paymentLogic.ts` and `ptResourceLogic.ts` compute cents, discounts, and resource caps; keep changes in sync with UI validators and Prisma constraints.

## Conventions & Integration

- **Server Actions** Start files with `'use server'` and fetch the session via `auth.api.getSession({ headers: await headers() })` so middleware auth works on the edge.
- **User-Level API Calls** Route handlers under `app/api/servers/**` proxy to the Pterodactyl client endpoints using the logged-in user's `ptKey` and `NEXT_PUBLIC_PTERODACTYL_URL`.
- **Realtime Console** `hooks/useWebSocket.ts` manages Pterodactyl websocket auth, reconnection, and event fan-out. `hooks/useServerWebSocket.ts` is the server-scoped wrapper; reuse these instead of hand-rolling sockets.
- **Shared Types** Prefer `models/prisma.ts` and `models/config.ts` to stay aligned with Prisma payloads and form schemas when moving data between server actions and client components.
- **Intl Copy** Translations live in `messages/{locale}.json`; add keys there and access via `useTranslations()` to keep both locales in sync.
- **Logging** Use `logger` from `@/lib/logger` for all server-side logging. Supports structured logs with `LogType` and `LogLevel`. Never use raw `console.log` in server code.
- **KeyValue Store** Runtime config (e.g. `FREE_SERVERS_LOCATION_ID`) lives in the `KeyValue` table; read via `lib/keyValue.ts` helpers.
- **Notifications** `lib/Notifications/telegram.ts` for admin alerts; `lib/email/sendEmailEmailsFromLake.ts` for user-facing emails.
- **Design Choices** The shadcn `Card` already has dynamic padding so it is more space-efficient on mobile. Avoid adding extra padding or margin to it. When not using the `Card` component, use `p-2 md:p-6`.

## Agent Workflow

- **Project Guidance** Treat this file as the canonical repo guidance for Codex and similar agents.
- **Skills** Reusable project skills live under `.agents/skills/`. Prefer those skills when a task matches them.
- **Safety** This repository may have unrelated local changes. Do not revert user edits unless the task explicitly requires it.
- **Validation** Prefer targeted checks for the files you changed before broader repo-wide commands.

## Tooling

- **Install & Run** Use bun: `bun install`, `bun dev` (Turbopack), `bun build`, `bun start`; ensure `NEXT_PUBLIC_APP_URL` matches the dev URL for Stripe return links.
- **Database** Spin up Postgres with `docker compose up db`; run `bunx prisma migrate dev --name <desc>` followed by `bunx prisma db seed` (loads demo game data and locations).
- **Stripe** Set `webhookSecret`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; webhook route expects the raw body so avoid body parsers when adding middleware. Also handle: `checkout.session.expired`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `charge.refunded`, `refund.updated`, `charge.dispute.created`.
- **Pterodactyl** Provide `NEXT_PUBLIC_PTERODACTYL_URL` (no trailing slash) and `PTERODACTYL_API_KEY`; user-specific requests rely on `session.user.ptKey` populated during signup.
- **Secrets** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, Discord + Google creds, and DB settings live in `.env`; copy from `.env.example` when onboarding.
- **Formatting** Repository relies on Prettier + `eslint-config-next`; follow existing import aliases from `tsconfig.json` (`@/` root path) when creating new modules.
