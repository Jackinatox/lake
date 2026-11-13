# Satisfactory interactive map

Satisfactory servers get an "Interactive map" panel in the dashboard's "Map" tab (the Config
tab, renamed for this game): an "Open newest save" button on top and every save listed below
with its own button. Each opens the hosted
map of satisfactory-calculator.com (SCIM) with `?url=<save link>`, so the map loads the save
straight from lake. Lake streams the file through a public, CORS-enabled route that is authorized
only by a signed 24-hour token in its path. There is no extra server and no database table.

## Files

- `components/gameserver/gameConfig/satisfactory/InteractiveMapPanel.tsx`: the panel (newest
  save + button, list of all saves with a button each, refresh). Registered as `satisfactory` in
  `gameConfig/registry.ts`. Messages: `gameserver.config.satisfactory.map.*` (en + de).
- `app/actions/gameservers/satisfactoryMap.ts`:
  `createSatisfactoryMapLink(ptServerId, locale, file?)` checks the session owns an `ACTIVE`,
  unsuspended Satisfactory server and returns the map URL. Without `file` the link serves the
  newest save, with it exactly that file.
- `lib/satisfactoryMap/token.ts` (server-only): `createMapToken` / `verifyMapToken` /
  `buildMapUrl`, `MAP_LINK_TTL_SECONDS`, `MAP_ORIGINS`.
- `lib/satisfactoryMap/saves.ts`: `SATISFACTORY_SAVE_DIR`, `listSaves` (newest first),
  `isSaveFileName`, `displaySaveName`. Used by both the panel (client) and the route (server).
- `app/api/satisfactory-map/[token]/save.sav/route.ts`: `GET` / `HEAD` / `OPTIONS`.

## Save location (verified on a real server)

World saves are in `/.config/Epic/FactoryGame/Saved/SaveGames/server/`, for example
`<session>_autosave_0.sav` and manual saves. "Newest" means the `.sav` with the latest
`modified_at`, which covers both autosaves and manual saves. The parent `SaveGames/` also holds
`ServerSettings.<port>.sav` (server config, not a world), so only `server/` is listed. Before
the first session the folder doesn't exist. Pterodactyl then answers with a 500, so
`listSaves` re-checks the root listing and returns `[]` ("no save yet") when that works.

Uploading a save through the in-game server manager puts it in the same folder. It doesn't become
the newest file until the server writes to it: loading another session first saves the old one,
and the new session only shows up as newest at its next autosave. That is why the panel lists
every save.

The game writes non-ASCII names with each UTF-8 byte sign-extended into U+FF80–U+FFFF ("ö" is
stored as U+FFC3 U+FFB6). `displaySaveName` decodes that for display. The route sends the real
name only as RFC 5987 `filename*`, because Node rejects such characters in header values.

## Link and token

`createMapToken` returns `<ptServerId>.<expiryUnixSeconds>.<hmac>` (newest save) or
`<ptServerId>.<expiry>.<base64url file name>.<hmac>` (that save). The HMAC is SHA-256 over
`satisfactory-map:` plus everything before the last dot, keyed with `BETTER_AUTH_SECRET`, so the
file name can't be swapped. The map URL is
`https://satisfactory-calculator.com/<en|de>/interactive-map?url=<encoded save link>`. The save
link is `${NEXT_PUBLIC_APP_URL}/api/satisfactory-map/<token>/save.sav`, so it must be a
public HTTPS host (on dev, `devlake.scyed.com`, not localhost). Tokens are stateless: a link
can't be revoked before it expires, but it stops working as soon as the server is no longer
`ACTIVE`, is suspended, or isn't Satisfactory any more.

## Route behavior

1. Verify the token: 404 when invalid, 410 when expired.
2. Load the server (`ACTIVE`, slug `satisfactory`, no active suspension) and its owner's
   `ptKey`. Return 404 otherwise.
3. `listSaves`, then pick the newest one or the token's file. Return 404 "no save yet", or 404
   "this save no longer exists" when the named file is gone, or 502 when the panel is
   unreachable. A file name is only served when it is in the listing, which also keeps it
   inside the save folder.
4. Return 304 when the request's `If-None-Match` contains the save's `ETag` (a hash of name,
   mtime and size). Without `If-None-Match`, return 304 only when `If-Modified-Since` equals
   the save's mtime (second precision), not when it is later: after the newest save is
   deleted, the next one is older than the cached copy and must still be sent. The map loads
   with a plain jQuery GET, so these headers come from the browser cache. `HEAD` returns only
   the headers.
5. Otherwise request a fresh Wings download link (`getDownloadUrl`) and stream its body through.

Every response carries `Access-Control-Allow-Origin` for `MAP_ORIGINS`. Save responses (200
and 304) add `ETag`, `Last-Modified` and `Cache-Control: private, no-cache`; errors send
`Cache-Control: no-store`. `OPTIONS` answers the preflight and allows any
requested header. The Wings link can't be handed to the map directly: it works only once, a
second GET returns 404, and Wings only sends CORS for the panel origin.

## Usage logging

Two `INFO` lines of type `GAME_SERVER` in the `Log` table, each bound to the user and gameserver,
with `details.target` set to `newest` or `file`:

- `Satisfactory map: link opened`: written by `createSatisfactoryMapLink`, once per button click.
- `Satisfactory map: save served`: written by the route when it starts streaming a save
  (`details.file`, `size`, `origin`). Not written for 304, `HEAD` or errors.

Clicks without a matching "save served" line are maps that didn't load the save (or a blocked
tab). Failures are logged as `WARN` lines (`listing the save folder failed`, `downloading the
save failed`).
