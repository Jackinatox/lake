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

A server is suspended while a row satisfies
`liftedAt IS NULL AND expiresAt > now() - SUSPENSION_GRACE_MINUTES` — see the grace window below.

## Schema (`prisma/schema.prisma`)

`GameServerSuspension` — `gameServerId`, `type` (`SuspensionType`, currently only
`QUARANTINE`), `reason` (`@db.Text`, shown to the user verbatim), `expiresAt`,
`deleteAfterExpiry`, `liftedAt` / `liftedByUserId`, `createdByUserId`.

`liftedAt` is what distinguishes "an admin released this early" from "it ran out", and lets
the row survive as an audit record either way. Both user FKs are `onDelete: SetNull` so an
admin account stays deletable.

A third writer: `deleteGameServers` and `deleteFreeServer` set `liftedAt` (with no
`liftedByUserId`) when the server itself goes away, so the worker stops owing work on a server
that no longer exists. `hardDeleteGameServer` does not need to — the row cascades with the
`GameServer`.

There is **no** DB-level uniqueness constraint: a partial unique index on `liftedAt IS NULL`
would wrongly block re-suspending a server whose previous suspension lapsed naturally.
`suspendGameServer` rejects a second *active* suspension in application code instead.

## The grace window (`SUSPENSION_GRACE_MINUTES = 15`)

`expiresAt` is only the moment a suspension *may* be processed. The worker's
`PROCESS_SUSPENSIONS` job is what actually PT-unsuspends or deletes the server and it runs on
an interval (10 minutes). Between the two, lake would otherwise show a released server whose
dashboard Pterodactyl still refuses — or a "free again" server that is about to be deleted.

So a lapsed suspension keeps counting as active for another `SUSPENSION_GRACE_MINUTES`
(`lib/gameserver/suspension.ts`). The cushion must cover the worst case — the job firing just
*before* a suspension lapses, so the next run is a full interval away — hence 15 > 10.
Equal to the interval is **not** enough: a suspension lapsing one second after a run would go
uncovered for the rest of that interval.
**If the job interval changes, this constant has to move with it.**

The window costs nothing when the worker is healthy: processing sets `liftedAt`, and every
predicate also requires `liftedAt IS NULL`, so the extra minutes are only ever spent waiting
for work that has not happened. The trade is deliberate and one-directional — a server can
stay suspended in lake a few minutes too long, but never appear free while it is not.

`isSuspensionProcessing(suspension)` marks that window for the UI: inside it the end date is
already in the past, so `ServerSuspended`, `GameServerCard` and the admin table stop naming it
as a deadline (`ServerSuspended.processing` / `.processingDeletion` in `messages/{en,de}.json`,
a `· pending` marker for admins) and say the suspension is being processed instead.

## Reading the suspension

`lib/gameserver/suspension.ts` is the single place that knows the shape:

- `suspensionActiveCutoff()` — `now() - SUSPENSION_GRACE_MINUTES`. **Every** query or guard
  asking "is this suspended?" compares against this, never against `new Date()`, or the UI,
  the admin filter and the unsuspend guard drift apart.
- `activeSuspensionInclude()` / `activeSuspensionSubSelect()` — Prisma fragments pulling the
  one active suspension onto a `GameServer` query. They are **functions**, not consts: a
  module-level `new Date()` would freeze at import time.
- `getActiveSuspension(server)` — narrows the `take: 1` array to one row or `null`.
- `isSuspensionProcessing(suspension)` — lapsed but not yet processed, see above.
- `suspendedServerWhere()` — `where` fragment for "currently suspended", used by the admin filter.

Callers that already include it: `getUserServer`, `getOwnedGameServerSummary`, the admin
gameservers page, and `FreeServerUpgrade`. `ClientServer` and `GameServerAdmin` in
`models/prisma.ts` both carry `suspensions: ActiveSuspension[]`, so a new query that forgets
the include fails to typecheck.

`lib/gameserver/requireUnsuspended.ts` is the server-side half — see *The guard for server
actions* below. It is a separate file because `suspension.ts` is imported by client components
and so must stay free of Prisma.

## Monitoring

`/api/promExport` exposes two gauges (`app/api/promExport/route.ts`):

- `lake_game_servers_suspended_total` — servers currently under a suspension, grace window
  included.
- `lake_suspensions_awaiting_processing_total` — `liftedAt IS NULL AND expiresAt <= now()`,
  i.e. rows the worker owes work on. **This is the one that matters.** A row that stays here
  longer than the grace window is a server lake reports as free while Pterodactyl still has it
  frozen, and nothing in the UI shows it — every other predicate uses the cutoff, so a lapsed
  suspension drops out of the admin filter too. Alert on it.

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
  active suspension exists** (grace window included) unless `force: true`. That one check
  covers `upgradeServer`, `upgradeFromFree` and `undoRefundedOrder`, which would otherwise
  release a quarantined server when a user renews/upgrades or a refund is reverted. It returns
  `ToggleSuspensionResult`; a refusal is `{ success: false, suspensionBlocked: true }` and
  **callers must not treat the server as released** — `extendFreeServer` stops, and
  `upgradeGameServer` logs an error because the order is already paid.

The Next.js UI blocking below is defense in depth, not security: server actions and the
client's direct PT calls do not pass through a layout.

### The guard for server actions

PT suspension only covers the *client* API. An action that reaches PT with
`PTERODACTYL_API_KEY` or that hands the job to the worker sails straight past it, and no
server action runs the `[server_id]` layout. So every user-facing, server-scoped action calls
`refuseIfSuspended(gameServerId, action, userId)` from `lib/gameserver/requireUnsuspended.ts`,
which returns `true` when the action must be refused and logs the refusal against the owner.

| Action | File | Would otherwise get through because |
| --- | --- | --- |
| `changeGame` | `changeGame/[gameSlug]/changeGameAction.ts` | worker reinstalls the server |
| `reassignPortsAction` | `settings/NetworkManager/` | worker call |
| `updateStartupCommand` | `settings/serverSettingsActions.ts` | application API |
| `changeServerStartup` | same | application API (was only blocked by accident) |
| `deleteFreeServer` | same | application API — and deleting cleared the way for a new free server |
| `renameClientServer`, `reinstallServer` | same | already blocked by PT; guarded so the rule has no exceptions |
| `extendFreeServer` | `app/actions/gameservers/` | wrote `ACTIVE` + a new expiry and burned the cooldown |
| `checkoutAction` (`UPGRADE`) | `app/actions/checkout/checkout.ts` | took money for a server that stays frozen |

Keep the list total: a new action that touches a specific gameserver on the owner's behalf
belongs in it. `updateFtpPassword` is the deliberate exception — it changes the panel
*account* password, not anything server-scoped.

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

`suspendGameServer` rejects a second suspension using `suspensionActiveCutoff()`, so a server
still inside the grace window cannot be re-suspended while the UI shows it as suspended.
`liftGameServerSuspension` only checks `liftedAt`, which is what lets an admin release a server
during that window — the rare case the cushion would otherwise strand. Extending works there
too: `futureDateSchema` forces a date in the future, which pulls the row back out of the
worker's queue.

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
+7d/+14d/+30d preset buttons that *add* onto the date currently in the field (empty/invalid
falls back to now + n days), plus a line under it stating how long the suspension runs from
now.

All three dialogs stay **mounted while closed** (`AdminServerActionsMenu` renders them
unconditionally and only flips `open`), so their state must be restored when they are
*opened*, never when they are closed. `SuspendDialog` does that in one `useEffect` on `open`:
end date `DEFAULT_SUSPENSION_DAYS` (14) out from *now*, `deleteAfterExpiry` on, and the reason
re-fetched (see below). `ExtendSuspensionDialog` does the same, keyed on the *value* of
`suspension.expiresAt` — not the object, which the parent rebuilds on every render and which
would therefore wipe what an admin is typing.

### Configurable default reason

The prefilled reason is the `suspension_default_reason` KeyValue row (type `TEXT`, so
`/admin/keyvalue` edits it in Monaco). The row is the **only** place the text lives — there is
no hardcoded fallback, so a missing row just means the admin writes the reason from scratch.

The admin gameservers `page.tsx` reads it with `getKeyValueString` alongside its other
queries and passes it down as `suspensionDefaultReason` (`GameserversTable` →
`AdminServerActionsMenu` → `SuspendDialog`'s `defaultReason`). No client fetch, no loading
state: the dialog opens with the text already in it.

The row is written by `prisma/seed.ts` for new databases and by
`prisma/migrations/20260822213938_add_suspension_default_reason` (`ON CONFLICT DO NOTHING`)
for existing ones. It is deliberately **not** in `REQUIRED_DB_CONSTANTS` (`lib/startup.ts`):
an empty prefill is not worth refusing to boot over.

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
`GameServerStatus.tsx` short-circuits before the PT fetch and shows `suspended`; when it does
fetch, a `403` also maps to `suspended` (that is what PT returns for a server lake no longer
counts as suspended but the worker has not released yet) and any other failure to `Error`, so
the badge never sits on "Loading" forever.

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

**Writing `liftedAt` is what ends the grace window**, so it must be set in the same run that
touched Pterodactyl — never skipped, or lake keeps the server suspended for exactly
`SUSPENSION_GRACE_MINUTES` and then shows it as free while PT still has it frozen. The job
interval also has to stay well under `SUSPENSION_GRACE_MINUTES` (10); it is 5 minutes today.

Give this its own `WorkerJobType` (`PROCESS_SUSPENSIONS`) rather than overloading
`EXPIRE_SERVERS` / `DELETE_SERVERS`, so the lifecycle and suspension axes stay independent
and `JobRun` reporting stays readable.
