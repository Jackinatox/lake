# Server suspension (quarantine)

Admins can freeze a misused gameserver: it is suspended in Pterodactyl so the user cannot
reach it, its dashboard is blocked, and the user is emailed the reason and the end date.
The suspension lives in its own `GameServerSuspension` table, **not** in `GameServerStatus`.
The worker (separate repo) is what eventually deletes or releases the server — see the
contract at the bottom.

## Why a table and not a `GameServerStatus` value

`GameServerStatus` is a lifecycle state machine (`CREATED → ACTIVE → EXPIRED → DELETED`).
A suspension is *orthogonal*: a server can be suspended while `ACTIVE` **or** while `EXPIRED`.
Folding a `SUSPENDED` value into the enum would overwrite the lifecycle state, leaving
nothing to restore when the suspension is lifted, and any job that writes `status` would
silently erase the marker.

A server is suspended while a row satisfies `liftedAt IS NULL AND expiresAt > now()`.

## Schema (`prisma/schema.prisma`)

`GameServerSuspension` — `gameServerId`, `type` (`SuspensionType`, currently only
`QUARANTINE`), `reason` (`@db.Text`, shown to the user verbatim), `expiresAt`,
`deleteAfterExpiry`, `liftedAt` / `liftedByUserId`, `createdByUserId`.

`liftedAt` is what distinguishes "an admin released this early" from "it ran out", and lets
the row survive as an audit record either way. Both user FKs are `onDelete: SetNull` so an
admin account stays deletable.

There is **no** DB-level uniqueness constraint: a partial unique index on `liftedAt IS NULL`
would wrongly block re-suspending a server whose previous suspension lapsed naturally.
`suspendGameServer` rejects a second *active* suspension in application code instead.

## Reading the suspension

`lib/gameserver/suspension.ts` is the single place that knows the shape:

- `activeSuspensionInclude()` / `activeSuspensionSubSelect()` — Prisma fragments pulling the
  one active suspension onto a `GameServer` query. They are **functions**, not consts: a
  module-level `new Date()` would freeze at import time.
- `getActiveSuspension(server)` — narrows the `take: 1` array to one row or `null`.
- `suspendedServerWhere()` — `where` fragment for "currently suspended", used by the admin filter.

Callers that already include it: `getUserServer`, `getOwnedGameServerSummary`, the admin
gameservers page, and `FreeServerUpgrade`. `ClientServer` and `GameServerAdmin` in
`models/prisma.ts` both carry `suspensions: ActiveSuspension[]`, so a new query that forgets
the include fails to typecheck.

## Enforcement

**Pterodactyl suspension is the real boundary.** `POST /api/application/servers/{id}/suspend`
stops the server, keeps files on disk, and PT's client-API middleware then rejects console,
power, file and websocket requests. The dashboard talks to PT directly with the user's
`ptKey`, so everything the UI does is already dead once PT is suspended.

`lib/Pterodactyl/suspendServer/suspendServer.ts`:

- `setPtSuspension(ptAdminId, action)` — raw PT call, does **not** touch `GameServer.status`.
  Suspension actions use this so the lifecycle stays untouched.
- `toggleSuspendGameServer(id, action, { force })` — unchanged behavior for the expire/refund
  callers (still writes `EXPIRED`/`ACTIVE`), plus a guard: **`unsuspend` refuses while an
  active suspension exists** unless `force: true`. That one check covers `upgradeServer`,
  `upgradeFromFree` and `undoRefundedOrder`, which would otherwise release a quarantined
  server when a user renews/upgrades or a refund is reverted.

The Next.js UI blocking below is defense in depth, not security: server actions and the
client's direct PT calls do not pass through a layout.

## Server actions — `app/actions/gameservers/suspensionActions.ts`

All admin-only via `requireAdmin()` (`lib/auth/requireAdmin.ts`, shared with
`adminServerActions.ts`), validated by `lib/validation/suspension.ts`, returning
`{ success, error }`.

| Action | Pterodactyl | Email |
| --- | --- | --- |
| `suspendGameServer` | suspend, skipped when already `EXPIRED` | **yes** — reason, end date, deletion warning |
| `liftGameServerSuspension` | unsuspend **only if** status is `ACTIVE`/`CREATED` and `expires > now()` | **yes** — restored (says so if still expired) |
| `extendGameServerSuspension` | — | **no**, deliberately |
| `getSuspensionHistory` | — | — |

### History

Every action writes an `ApplicationLog` row with `type: 'GAME_SERVER'` and
`details.event` of `SUSPENSION_CREATED` / `SUSPENSION_EXTENDED` / `SUSPENSION_LIFTED`, plus
the acting admin and (for extensions) `from` / `to` / `note`. `getSuspensionHistory` reads it
back with a JSON-path filter (`details: { path: ['event'], string_starts_with: 'SUSPENSION_' }`)
and the admin dialogs render it, so a moved end date is never silent.

## Admin UI — `app/[locale]/admin/gameservers/`

`AdminServerActionsMenu.tsx` shows **Suspend Server** when free, or **Extend Suspension** +
**Unsuspend Server** when suspended. The three dialogs live in `SuspensionDialogs.tsx`.
The extend dialog states plainly that the user is **not** notified. `GameserversTable.tsx`
adds a red "Suspended until …" line under the status pill and a *Suspension* filter
(`?suspended=true`).

`components/ui/` has no `calendar.tsx`, so dates use `<Input type="datetime-local">` with
+7d/+14d/+30d preset buttons.

## User-facing block

`app/[locale]/gameserver/[server_id]/layout.tsx` is the single choke point — it covers
`page.tsx`, `changeGame/**` and `upgrade/**`. It reuses the React-`cache()`d
`getOwnedGameServerSummary`, so the page below issues no second query. Suspended → renders
`components/auth/ServerSuspended.tsx` (same shape as `ServerExpired` / `ServerDeleted`,
namespace `ServerSuspended` in `messages/{en,de}.json`).

> **TODO:** the layout runs on every navigation into the dashboard. Cache the suspension row
> (e.g. `unstable_cache` tagged `gameserver-suspension-<id>`, invalidated by the three
> actions) and keep evaluating `expiresAt` in JS — a time-based predicate cannot be cached.

The gameservers list (`GameServerCard.tsx`) renders a suspended server red and **not** as a
link, with the reason, the end date, the deletion warning and a *Contact support* button.
`GameServerStatus.tsx` short-circuits before the PT fetch and shows `suspended`.

## Support appeals

`TicketCategory.SUSPENSION` groups appeals. `ContactForm.tsx` prefills from `?category=` (as
before) and now also `?subject=`, so both the dashboard card and the email link to
`/support?category=SUSPENSION&subject=…`.

## Emails

German like every other template, built on `lib/email/components`:

- `lib/email/templates/ServerSuspendedTemplate.tsx` → `EmailType.GAME_SERVER_SUSPENDED`
- `lib/email/templates/ServerUnsuspendedTemplate.tsx` → `EmailType.GAME_SERVER_UNSUSPENDED`

Sent by `sendServerSuspendedEmail` / `sendServerUnsuspendedEmail` in
`lib/email/sendEmailEmailsFromLake.ts`. `sendMail` gained an optional trailing
`gameServerId` argument so these rows link to the server via `Email.GameServerId`.

Both sends are `.catch()`-logged: the server is already frozen in PT and recorded, so a mail
failure must not fail the action.

## Worker contract (not implemented — separate repo)

Scan for rows where `liftedAt IS NULL AND expiresAt <= now()`:

- `deleteAfterExpiry = true` → delete the server in Pterodactyl, set
  `GameServer.status = 'DELETED'`, set `liftedAt = now()`.
- `deleteAfterExpiry = false` → PT-unsuspend, but **only** when the server is not otherwise
  expired (`status` is `ACTIVE`/`CREATED` and `expires > now()`); set `liftedAt = now()` either way.

Give this its own `WorkerJobType` (`PROCESS_SUSPENSIONS`) rather than overloading
`EXPIRE_SERVERS` / `DELETE_SERVERS`, so the lifecycle and suspension axes stay independent
and `JobRun` reporting stays readable.
