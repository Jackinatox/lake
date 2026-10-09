# Admin log viewer (`/admin/logs`)

Dense, filterable viewer for the `ApplicationLog` table. Rows are single-line
(28px) so ~25 entries fit on screen; clicking a row expands request context and
the `details` JSON. User and gameserver each get their own fixed-width column. Every filter lives in the URL, and each row links out to the
admin gameserver list filtered to the log's user (and server), because there is
no per-server admin page.

## Files

- `app/[locale]/admin/logs/page.tsx` — admin guard + `<Suspense>` around the viewer.
- `components/admin/logs/LogViewer.tsx` — filter/page state, URL sync, data fetching.
- `components/admin/logs/LogFilters.tsx` — filter bar (search, level, category,
  time range, user, server) plus the `LogFilterState` type.
- `components/admin/logs/LogUserPicker.tsx` — translated wrapper around
  `components/admin/AdminUserPicker.tsx`, the shared server-side-searching user
  combobox (also used by the gameserver panel).
- `components/admin/logs/LogList.tsx` — column header, rows, pagination.
- `components/admin/logs/LogRow.tsx` — one log line + expanded details.
- `app/actions/logs/getApplicationLogs.ts` — `getApplicationLogs`,
  `searchLogUsers`, `getLogUserServers` (all admin-only).
- `lib/validation/adminContent.ts` — `logFiltersSchema`, `logUserSearchSchema`,
  `logUserServersSchema`.
- `models/prisma.ts` — `ApplicationLogWithRelations` (the `gameServer` select
  includes `userId` so a row can link to the owner).

## Filters and URL state

`LogViewer` seeds its state from the query string once, then treats component
state as the source of truth and writes it back with `router.replace`:

| URL param       | State          | Notes                                                              |
| --------------- | -------------- | ------------------------------------------------------------------ |
| `search`        | `search`       | matches `message` **or** `path`, case-insensitive, debounced 400ms |
| `level`         | `level`        | omitted when `ALL`                                                 |
| `type`          | `type`         | omitted when `ALL`                                                 |
| `range`         | `timeRange`    | omitted when `1d` (the default)                                    |
| `userId`        | `userId`       | matches `ApplicationLog.userId` **or** `gameServer.userId`         |
| `serverId`      | `gameServerId` | `ApplicationLog.gameServerId`                                      |
| `page`, `limit` | pagination     | `limit` ∈ {50, 100, 200}, default 100                              |

Filtering by a user therefore also returns entries that only carry a
`gameServerId`, as long as that server belongs to them (worker/system logs).
Clearing the user filter also clears the server filter (a server filter without
its owner is meaningless). Any filter change resets to page 1.

## Row links — two different targets

Each row shows the attached user and gameserver on the right. Both offer:

1. **Funnel icon** → filters _this_ log list (`onFilterUser` / `onFilterServer`
   in `LogViewer`). Filtering by a server also pins its owner, so removing the
   server filter falls back to all logs of that user.
2. **The name itself** → `/admin/gameservers?userId=…` for a user, and
   `/admin/gameservers?userId=<owner>&serverId=<id>` for a server. The owner
   comes from `gameServer.userId`, so it is correct even when the log row has no
   `userId` of its own.

The log filter's server selector marks `FREE` servers with coloured text plus a
small "Free" suffix; paid servers render plain. `getLogUserServers` therefore
selects `type` as well.

## Gameserver admin `serverId` filter

`app/[locale]/admin/gameservers/page.tsx` accepts `serverId` (mapped to `where.id`).
It has no control of its own in that filter bar — it is a deep-link target only. To
widen the view from one server to its owner's whole fleet, the row's owner funnel
sets `userId` and drops `serverId` in one click; "Clear" removes every filter.
A `serverId` (or `search`) lookup also lifts that page's default "hide deleted"
scope, so a log about an already-deleted server still resolves to its row. The
panel links back: every row has a logs link, and its error badge opens this
viewer filtered to that server. See `admin-gameserver-panel.md`.

## Schema notes

`ApplicationLog` has single-column indexes on `userId` and `gameServerId`, but
the list always sorts by `createdAt desc`. Composite indexes
`@@index([userId, createdAt])` and `@@index([gameServerId, createdAt])` would
let Postgres filter and sort in one index once the table grows; the message
search is a `contains` scan and would need a `pg_trgm` GIN index to stay fast.
