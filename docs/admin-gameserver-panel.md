# Admin gameserver panel (`/admin/gameservers`)

Dense, URL-driven cockpit for the gameserver fleet. Top to bottom: the filter bar
(incl. a `created` timespan), six KPI tiles, a row of "needs attention" chips, a
stacked distribution bar, and a 32px-per-row list with expandable detail. The filters
come first because **everything below them describes the set they define**. It replaces the old 14-column
`GameserversTable` and shares its idiom with the log viewer (see
`admin-log-viewer.md`) — colour instead of badges, one line per record, every bit of
state in the query string. There is still no per-server page; the expanded row is it.

## Files

- `app/[locale]/admin/gameservers/page.tsx` — admin guard, param parsing, every query.
- `app/[locale]/admin/gameservers/FleetSummary.tsx` — KPI tiles + attention chips.
- `app/[locale]/admin/gameservers/FleetDistribution.tsx` — distribution card (5 dimensions).
- `app/[locale]/admin/gameservers/ServerFilters.tsx` — filter bar (themed game icons via
  `ThemeImage`, see `game-images.md`) + clear-all button.
- `app/[locale]/admin/gameservers/ServerList.tsx` — header, sorting, selection, paging.
- `app/[locale]/admin/gameservers/ServerRow.tsx` — one server line + expanded detail.
- `app/[locale]/admin/gameservers/useFleetParams.ts` — the only writer of the query string.
- `app/[locale]/admin/gameservers/presentation.ts` — status/plan colours, expiry tone.
- `app/[locale]/admin/gameservers/types.ts` — `FleetStats`, `FleetSlice`, filter/sort state.
- `lib/gameserver/adminFleet.ts` — fleet scope, attention + renewal definitions, formatting.
- `lib/Pterodactyl/panelUrls.ts` — deep links into the Pterodactyl panel.
- `components/admin/AdminUserPicker.tsx` — shared server-side-searching user combobox.
- `models/prisma.ts` — `GameServerAdminRow` (the row payload).
- Unchanged and reused: `EditServerDialog`, `AdminServerActionsMenu`, `SuspensionDialogs`.

## One selection, three views

The summary tiles, the distribution bar and the list all read the **same** `where` — the
one the filter bar defines. Only the list is paginated; the aggregates always cover the
whole selection, so "50 of 412 servers" in the list and "412" in the tiles are the same set
seen at two resolutions, and a segment of the bar is always exactly a slice of the list.

That includes the default scope: deleted servers are left out of the chart exactly when
they are left out of the list, never on a rule of the chart's own.

The filter is built as _named pieces_ (`parts` in `page.tsx`) and `selection(...without)`
reassembles them. Only one caller passes `without`: the **attention chips** count without
their own filter applied. They are a toggle group, and counting them inside their own
selection would zero out every chip but the active one — and a chip showing 0 is disabled,
so there would be no way to switch from one to another.

Default scope is the live fleet (`status != DELETED`, the `scope` piece). It is dropped
when the status filter explicitly asks for deleted rows (`DELETED` or `ANY`), and when a
`serverId` or `search` pinpoints a row — finding a deleted server is usually the reason
such a link was followed.

## URL params

| Param                  | Meaning                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `search`               | name, lake id, `ptServerId`, numeric `ptAdminId`, owner email/username             |
| `userId`               | owner; clearing it also clears `serverId`                                          |
| `serverId`             | single server — no control of its own, a deep-link target only                     |
| `type`                 | `FREE` / `PACKAGE` / `CUSTOM`                                                      |
| `locationId`, `gameId` | numeric; a non-numeric value is ignored, not passed to Prisma                      |
| `status`               | a `GameServerStatus`, or `ANY` for "incl. deleted"; absent = all but deleted       |
| `attention`            | one `AttentionKey` (see below)                                                     |
| `renewal`              | one `RenewalKey` (see below)                                                       |
| `sort`, `dir`          | `created` (default) / `expires` / `name` / `price` / `ram` / `cpu`; `desc` default |
| `page`, `limit`        | `limit` ∈ {25, 50, 100, 200}, default 50                                           |
| `suspended=true`       | legacy alias of `attention=suspended`, kept for bookmarked links                   |

`useFleetParams` is the single writer: `setParams` patches (and resets `page`),
`toggleParam` clears a param that already holds the clicked value, and `only`
replaces the whole filter set — that last one is what the distribution bars use, so
clicking a slice shows _that_ slice instead of intersecting it with whatever was
already filtered. All three push inside a transition, and the `pending` flag dims the
affected card while the server component re-renders.

## Attention chips

`ATTENTION_META` / `attentionWhere()` in `lib/gameserver/adminFleet.ts`. The chip's
count and the filtered list use the _same_ `where` fragment, so a chip that says 3
always lists exactly those 3 servers.

| Key         | Detects                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `failed`    | `CREATION_FAILED` — PT rejected the create call                                  |
| `stuck`     | still `CREATED` after `STUCK_INSTALL_MINUTES` (30) — install never reported back |
| `orphaned`  | live server with no `ptServerId`/`ptAdminId` — lake cannot reach it              |
| `overdue`   | `ACTIVE` past its expiry — the worker has not caught up                          |
| `suspended` | `suspendedServerWhere()`, i.e. incl. the grace window                            |
| `errors`    | ERROR/FATAL `ApplicationLog` rows in the last `ERROR_WINDOW_HOURS` (24)          |

## Distribution card

One **stacked bar**, not a row per slice: five dimensions (Location, Game, Status, Plan,
Renewals) across a single 12px bar, with a legend underneath that doubles as the direct
labels and as the filter — clicking a segment or a legend chip applies that slice,
clicking the active one clears. Hovering either dims the other segments.

Every bar is a `groupBy` over the current selection, so filtering a dimension collapses
its own bar to a single full-width segment — the dropdown (or Clear) is how you move to
another slice. Location and Game also carry `_sum` of `ramMB`/`cpuPercent`, so they can be
weighted **by servers or by RAM** — the RAM view is the capacity picture (which location
carries the sold GiB), the server view is the headcount. Renewals are five _exclusive_
buckets (`renewalWhere()`: overdue, ≤24h, 1–7d, 7–30d, 30d+) over live servers only;
deliberately not cumulative, because an "expiring this week" number that swallows the
overdue ones hides the only bucket an admin has to act on.

Colour rules worth keeping:

- Status, Plan and Renewals carry their own meaning-colours (`presentation.ts`,
  `RENEWAL_BAR`) — the same ones the rows use, so a red dot means the same thing everywhere.
- Location and Game have no natural colour, so they draw from `SERIES_COLORS`, a fixed
  eight-slot categorical palette with a light and a dark step per slot. Slots are handed
  out by a **stable sort of the entity id**, never by the slice's current rank, so
  filtering never repaints the survivors. Past eight entities the rest folds into a grey
  "Other" slice instead of inventing a ninth hue.
- The palette is validated for colour-vision deficiency against both surfaces (worst
  adjacent ΔE 9.1 light / 8.4 dark, OKLab ×100). Three light steps sit under 3:1 contrast,
  which is allowed only because every slice is named in the legend — do not drop the legend.
- Segments are separated by a 2px gap that shows the surface, never by a border, and
  zero-weight slices are kept out of the bar (they would still eat a gap) but stay in the
  legend, where a "0" is worth reading.

## Row

One 32px line: status dot, name (+ free marker, suspension, missing-PT-link and error
badges), owner, game, location, `3t · 3G · 16G` compute, `10b · 2p` backups/ports,
price, relative expiry (red overdue / amber < 24 h), the `ptServerId` (click to copy — it
is the id that goes into the panel or a ticket; `—` when the server was never
provisioned), a logs link, a PT-admin link and the actions menu. The expanded panel groups into three columns — **identity** (server id, owner, both PT
ids, all copyable), **setup** (status, game, plan, and one `Resources` line carrying CPU,
RAM, disk, backups, ports and the tier) and **dates** (created, last extended, expires) —
followed by `errorText`, the full suspension, `gameConfig` JSON and a link row.

## Links out — and back in

- Row → `/admin/logs?userId=…&serverId=…&range=7d`, and the red error badge →
  the same with `level=ERROR&range=1d`. Together with the log viewer's links _into_
  this page, a server can be followed in both directions without a search.
- `panelServerUrl` (PT console, `{panel}/server/{ptServerId}`),
  `panelAdminServerUrl` (`{panel}/admin/servers/view/{ptAdminId}`) and
  `panelAdminUserUrl` (`{panel}/admin/users/view/{ptUserId}`) all return `null` when
  the id or `NEXT_PUBLIC_PTERODACTYL_URL` is missing, so an unprovisioned server
  simply shows no link.

## Query cost

One `Promise.all` does the page, its count, the fleet aggregate, four `groupBy`s, the
renewal-value sum, 6 attention counts, 5 renewal counts and the filter options; a
second query groups error logs for the ids on the page. ~20 round trips per view —
fine for an admin screen, but worth folding into fewer statements if the fleet (or the
`ApplicationLog` table) grows a lot. The composite indexes suggested in
`admin-log-viewer.md` would also help the `errors` chip.
