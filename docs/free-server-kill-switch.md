# Free server creation kill switch

A single boolean `KeyValue` row can stop all new free server creations. When it
is off — or when `free_tier_max_servers` is `0` — the free order pages show an
explaining banner instead of an enabled create button, and the checkout server
action refuses provisioning after re-reading the flag straight from the DB.

## The key

- **Key:** `free_server_creation_enabled`, type `BOOLEAN`, default `true`.
  The flag is positive: `true` = free servers can be created, `false` = kill
  switch engaged. A missing/null value falls back to `true` so a bad row never
  silently kills the free tier.
- Constant: `FREE_SERVER_CREATION_ENABLED` in `app/GlobalConstants.ts`
- Seeded as `true` in `prisma/seed.ts`, and listed in `REQUIRED_DB_CONSTANTS`
  in `lib/startup.ts` — the app **refuses to boot** if the row is missing. On an
  already-seeded database create the row manually at `/admin/keyvalue`
  (BOOLEAN, `true`) before deploying.
- Admins flip it at `/admin/keyvalue`.

## UI (banner)

`components/order/free/FreeCreationDisabledBanner.tsx` renders the explanation.
It reads namespace `freeServer.creationDisabled` (`title` / `description`) from
`messages/en.json` / `messages/de.json`.

Both free order pages compute the same condition:

```ts
const freeServersUnavailable = !creationEnabled || maxFreeServers === 0;
```

| Page                                          | Behavior                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/order/free/page.tsx`            | Renders the banner above the specs card. Game cards stay clickable.                                                          |
| `app/[locale]/order/free/[gameSlug]/page.tsx` | Sets `stats.creationNotAllowedReason = 'CREATION_DISABLED'`, which takes priority over `TOO_MANY_SERVERS` / `NOT_LOGGED_IN`. |

`FreeGameBookingSlug.tsx` swaps its plain yellow notice for the banner when the
reason is `CREATION_DISABLED`, and disables the create button (the existing
`isCreationDisabled` path already covers any non-null reason). Its other
disabled messages now come from `freeServer.disabledReasons.*` instead of
hardcoded English.

Pages read the flag with `getKeyValueBoolean` (request-cached).

## Enforcement (provisioning)

`checkoutFreeGameServer` in `app/actions/checkout/checkout.ts` re-reads the flag
with `getKeyValueBooleanFresh` (`lib/keyValue.ts`) — an **uncached** DB read, so
flipping the switch takes effect immediately even while cached pages still serve
the form — and throws when it is `false`, before any `GameServerOrder` row is
created. The
`maxFreeServers === 0` case is already covered by `checkFreeServerEligibility`
(`count < 0` is never true).
