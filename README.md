<img src="./public/images/light/logo/ScyedLogo.webp" alt="Scyed Logo" width="200" />

# Lake
### Scyed Game Server Hosting Platform

A full-stack game server hosting platform with Stripe payments, Pterodactyl integration, and a free-tier system. Built with Next.js 16, TypeScript, and Prisma.

## Features

- **Multi-Game Support** - Minecraft, Palworld, and more with game-specific configurations
- **Free Tier** - 30 or 60-day renewable free servers with automatic cleanup
- **Payment Integration** - Stripe Embedded Checkout with webhook-driven provisioning
- **Server Management** - Real-time console, file manager with in-browser editing, resource monitoring
- **SFTP Access** - Full file access with password rotation via Pterodactyl API
- **Authentication** - Better Auth with Discord/Google OAuth and email/password. 2FA (Planned)
- **Internationalization** - almost Full German and English translations (next-intl)
- **Background Jobs** - Custom Bun worker for server provisioning, reminders, and cleanup

## Tech Stack

**Frontend**
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS + shadcn/ui components
- next-intl for i18n (de/en)
- Real-time WebSocket console

**Backend**
- Server Actions for mutations
- Route handlers for Pterodactyl API proxying
- Better Auth (Prisma adapter)
- Prisma ORM + PostgreSQL
- Nextjs caching for KeyValue from Database
- Upcomming: Redis cache

**Integrations**
- Pterodactyl Panel API (requires custom modifications)
- Stripe payment processing + webhooks
- Discord/Google OAuth

## Project Status

This is production code for Scyed.com. It likely won't work out of the box for others due to:
- Undocumented Pterodactyl Panel modifications
- Hardcoded assumptions about panel structure
- Custom API endpoints required on panel side

No setup documentation is planned. Use as reference only.

## Notes

License TBD.

No AI was harmend in the making of this project