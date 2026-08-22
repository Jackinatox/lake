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
- `components/admin/logs/LogUserPicker.tsx` — server-side-searching user combobox.
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

Both server selectors (the log filter and the gameserver admin filter) mark
`FREE` servers with coloured text plus a small "Free" suffix; paid servers render
plain. `getLogUserServers` and the admin page's `serverOptions` therefore select
`type` as well.

## Gameserver admin `serverId` filter

`app/[locale]/admin/gameservers/page.tsx` accepts `serverId` (mapped to
`where.id`) and passes `serverOptions` — all servers of the filtered user plus
the selected one — to `GameserversTable`, which renders the "Server" select.
Changing the user filter clears `serverId`. This is what makes "open one server
from a log, then drop the server filter to see the user's other servers" work.

## Schema notes

`ApplicationLog` has single-column indexes on `userId` and `gameServerId`, but
the list always sorts by `createdAt desc`. Composite indexes
`@@index([userId, createdAt])` and `@@index([gameServerId, createdAt])` would
let Postgres filter and sort in one index once the table grows; the message
search is a `contains` scan and would need a `pg_trgm` GIN index to stay fast.
