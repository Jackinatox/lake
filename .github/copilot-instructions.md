# Lake Copilot Guide

## Architecture
- **App Router** Next.js 15 app directory with locale-aware routing under `app/[locale]`; `middleware.ts` and `i18n/request.ts` enforce `de`/`en` locales and load `messages/*.json`.
- **Auth** `auth.ts` configures Better Auth with Prisma adapter plus Discord OAuth; user creation hooks provision a Pterodactyl account via `createPtClient()` and `createUserApiKey()`.
- **Database** Postgres via Prisma (`prisma/schema.prisma`); always import the shared client from `@/prisma` inside server actions, route handlers, and data-access helpers.
- **Domain Models** Core tables: `GameServer`, `GameServerOrder`, `Location`, `GameData`; enums like `OrderStatus` and `OrderType` drive provisioning state and pricing logic.
- **UI Stack** Tailwind + shadcn components (`components/ui/*`) with locale-aware pages; global layout loads `Navbar`, `Footer`, theme provider, and `NextIntlClientProvider`.

## Core Workflows
- **Booking Flow** `app/[locale]/booking2/[gameId]/page.tsx` guides users through hardware + game config, then calls `checkoutAction` in `app/actions/checkout.ts` which persists a `GameServerOrder` and returns a Stripe client secret.
- **Payment UI** `components/payments/PaymentElements.tsx` renders Stripe Embedded Checkout once the client secret arrives; gating is handled with `authClient.useSession()`.
- **Provisioning** Stripe webhook handler (`app/webhook/route.ts`) verifies signatures (`webhookSecret`), marks orders `PAID`, and delegates to `lib/Pterodactyl/createServers/provisionServer.ts` (for NEW) or `lib/Pterodactyl/upgradeServer/upgradeServer.ts`.
- **Pterodactyl Admin Calls** Admin-facing actions (e.g. `app/actions/gameservers/deleteGameServers.ts`) use `process.env.PTERODACTYL_API_KEY` with `createPtClient()` to mutate servers.
- **Pricing & Limits** `lib/GlobalFunctions/paymentLogic.ts` and `ptResourceLogic.ts` compute cents, discounts, and resource caps; keep any changes in sync with UI validators and Prisma constraints.

## Conventions & Integration
- **Server Actions** Start files with `'use server'` and fetch the session via `auth.api.getSession({ headers: await headers() })` (see `app/actions/checkout.ts`) so middleware auth works on the edge.
- **User-Level API Calls** Route handlers under `app/api/servers/**` proxy to the Pterodactyl client endpoints using the logged-in user's `ptKey` and `NEXT_PUBLIC_PTERODACTYL_URL`.
- **Realtime Console** `hooks/useWebSocket.ts` manages Pterodactyl websocket auth, reconnection, and event fan-out; reuse its API for live stats instead of hand-rolling sockets.
- **Shared Types** Prefer `models/prisma.ts` and `models/config.ts` to stay aligned with Prisma payloads and form schemas when moving data between server actions and client components.
- **Sentry** Instrumentation is already wired (`instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts` with `withSentryConfig`); wrap risky operations with Sentry logging instead of `console.error` when possible.
- **Intl Copy** Translations live in `messages/{locale}.json`; add keys there and access via `useTranslations()` to keep both locales in sync.
- **Design choices** The Shadcn Card already has a dynamic padding so its more space efficient on mobile devices. Avoid adding extra padding/margin to it. when you dont use the Card component, go with p-2 md:p-6

## Tooling
- **Install & Run** Use pnpm: `pnpm install`, `pnpm dev` (Turbopack), `pnpm build`, `pnpm start`; ensure `NEXT_PUBLIC_APP_URL` matches the dev URL for Stripe return links.
- **Database** Spin up Postgres with `docker compose up db`; run `pnpm exec prisma migrate dev --name <desc>` followed by `pnpm exec prisma db seed` (loads demo game data and locations).
- **Stripe** Set `webhookSecret`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; webhook route expects the raw body so avoid body parsers when adding middleware.
- **Pterodactyl** Provide `NEXT_PUBLIC_PTERODACTYL_URL` (no trailing slash) and `PTERODACTYL_API_KEY`; user-specific requests rely on `session.user.ptKey` populated during signup.
- **Secrets** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, Discord creds, and DB settings live in `.env`; copy from `.env.example` when onboarding.
- **Formatting** Repository relies on Prettier + `eslint-config-next`; follow existing import aliases from `tsconfig.json` (`@/` root path) when creating new modules.
