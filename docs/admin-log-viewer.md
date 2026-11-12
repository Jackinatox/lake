# Log table and admin log viewer (`/admin/logs`)

Lake and the external provisioning worker write every log line into one `Log` table,
told apart by `source` (`APP` / `WORKER`). `/admin/logs` is a dense, filterable viewer
over it, newest first: single-line (28px) rows, a source icon (globe = app, violet cog =
worker), and an expandable detail with request / job-run context plus the `details` JSON.
Every filter lives in the URL, and each row links out to the admin gameserver list
filtered to the log's user (and server), because there is no per-server admin page.

## The `Log` table (contract with the worker)

Lake owns the schema and runs the migrations (`20261112120000_unified_log_table` replaced
`ApplicationLog` and `WorkerLog`, copying their rows). The worker (`Jackinatox/lake-worker`)
keeps a copy of the model in its own `prisma/schema.prisma` and only runs `prisma generate`,
so a column change here must be mirrored there and both deployed together.

| Column                                     | Written by | Notes                                                |
| ------------------------------------------ | ---------- | ---------------------------------------------------- |
| `source`                                   | both       | `APP` from `lib/logger.ts`, `WORKER` from the worker |
| `level`, `type`, `message`, `details`      | both       | `type` is required; worker lines default to `SYSTEM` |
| `instanceId`                               | both       | lake instance / worker `INSTANCE_ID`                 |
| `component`                                | worker     | emitting service, e.g. `PterodactylPortService`      |
| `method`, `path`, `userAgent`, `ipAddress` | app        | request context                                      |
| `userId`, `gameServerId`                   | both       | `gameServerId` is `GameServer.id`, never the PT id   |
| `jobRunId`                                 | worker     | the job type is `JobRun.jobType`, not a `Log` column |

Rows copied from the old `WorkerLog` got `type = SYSTEM` and `instanceId = 'unknown'`; when
such a row had no job run, its old `jobType` (and a legacy `jobRun` tag) moved into
`details`. Readers of app-only data filter `source: 'APP'` (`logger.query`, the
`lake_app_logs_*` Prometheus metrics). The gameserver panel's error badges and `errors`
chip count both sources. Nothing deletes old rows yet.

## Files

- `app/[locale]/admin/logs/page.tsx` — admin guard + `<Suspense>` around the viewer.
- `components/admin/logs/LogViewer.tsx` — filter/page state, URL sync, data fetching with
  a latest-request guard so a slow old response cannot overwrite newer results.
- `components/admin/logs/LogFilters.tsx` — filter bar (search, source, level, category,
  worker job, time range, user, server) plus the `LogFilterState` type. The worker-job
  select is disabled for `source=APP`, and picking that source clears job filters.
- `components/admin/logs/LogUserPicker.tsx` — translated wrapper around
  `components/admin/AdminUserPicker.tsx`, the shared server-side-searching user
  combobox (also used by the gameserver panel).
- `components/admin/logs/LogList.tsx` — column header, rows, pagination, app/worker split.
- `components/admin/logs/LogRow.tsx` — one log line + expanded details.
- `components/admin/logs/sourceStyles.ts` — per-source icon and category tint (no badges).
- `app/actions/logs/getLogs.ts` — `getLogs`, `searchLogUsers`, `getLogUserServers`
  (all admin-only via `requireAdmin`), plus the `TimeRange`, `LogSourceFilter`,
  `LogUserOption`, `LogServerOption` types.
- `lib/validation/adminContent.ts` — `logFiltersSchema`, `LOG_SOURCES`, `LOG_TIME_RANGES`,
  `logUserSearchSchema`, `logUserServersSchema`.
- `models/prisma.ts` — `LogWithRelations` (the `gameServer` select includes `userId` so a
  row can link to the owner; `jobRun` carries id, job type, status, start).

## Query

`getLogs` is one `findMany` (ordered `createdAt desc, id desc`, plain `skip`/`take`) plus
one `groupBy source` for `appTotal`/`workerTotal`. The worker-job filter goes through the
relation (`jobRun: { jobType }`); app lines never match it.

## Filters and URL state

`LogViewer` seeds its state from the query string once, then treats component
state as the source of truth and writes it back with `router.replace`:

| URL param       | State          | Notes                                                              |
| --------------- | -------------- | ------------------------------------------------------------------ |
| `search`        | `search`       | `message` **or** `path`, case-insensitive, debounced 400ms         |
| `level`         | `level`        | omitted when `ALL`                                                 |
| `source`        | `source`       | `APP` / `WORKER`, omitted when `ALL`                               |
| `type`          | `type`         | category (`LogType`), omitted when `ALL`                           |
| `job`           | `jobType`      | worker job via `JobRun.jobType`, omitted when `ALL`                |
| `jobRunId`      | `jobRunId`     | one `JobRun`; set from a worker row's "job run" detail, no control |
| `range`         | `timeRange`    | omitted when `1d` (the default)                                    |
| `userId`        | `userId`       | matches the log's `userId` **or** `gameServer.userId`              |
| `serverId`      | `gameServerId` | the log's `gameServerId`                                           |
| `page`, `limit` | pagination     | `limit` ∈ {50, 100, 200}, default 100                              |

Filtering by a user therefore also returns entries that only carry a
`gameServerId`, as long as that server belongs to them (worker/system logs).
Clearing the user filter also clears the server filter (a server filter without
its owner is meaningless). Any filter change resets to page 1. Clicking a job run
replaces all filters with `source=WORKER&jobRunId=…&range=ALL`.

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
widen the view from one server to all of its owner's servers, the row's owner funnel
sets `userId` and drops `serverId` in one click; "Clear" removes every filter.
A `serverId` (or `search`) lookup also lifts that page's default "hide deleted"
scope, so a log about an already-deleted server still resolves to its row. The
panel links back: every row has a logs link, and its error badge opens this
viewer filtered to that server. See `admin-gameserver-panel.md`.

## Schema notes

`Log` has indexes on `createdAt`, `(source, createdAt)`, `(level, createdAt)`,
`(type, createdAt)`, `userId`, `gameServerId`, `jobRunId` and `(path, method)`. Composite
`(userId, createdAt)` / `(gameServerId, createdAt)` indexes would let Postgres filter and
sort in one index once the table grows; the message search is a `contains` scan and would
need a `pg_trgm` GIN index to stay fast.
