# Game config editors (Config tab)

The gameserver dashboard has a per-game **Config** tab with form-based editors for game
files, read and written through the Pterodactyl client file API. Minecraft ships a
whitelist manager and a `server.properties` editor. Games are registered by `gameSlug`, and
games without a registry entry get no tab. An amber dot on the tab trigger flags problems,
e.g. "whitelist on but empty" (the default since Minecraft 26.3, where `white-list=true`).

## Files

- `components/gameserver/gameConfig/registry.ts`: `GAME_CONFIG_REGISTRY` (slug → `GameConfigModule`).
- `components/gameserver/gameConfig/types.ts`: `GameConfigModule { panels, useAttention? }`.
- `GameConfigTab.tsx` renders the panels, `GameConfigAttentionDot.tsx` runs `useAttention`.
- `ConfigFileEditor.tsx`: generic form editor (category tabs, search, sticky save bar,
  restart prompt, "edit as text" → Monaco `FileManager/components/FileEditorDialog`).
- `lib/gameConfig/types.ts`: `ConfigFormat` (parse/keys/get/set/serialize) and `ConfigField`.
- `lib/gameConfig/formats/properties.ts`: Java `.properties` format.
- `hooks/useServerFile.ts`: module-level file cache keyed by `serverId:path`.
- `components/gameserver/gameConfig/minecraft/`: `index.ts` (module), `constants.ts`,
  `propertiesSchema.ts`, `PropertiesPanel.tsx`, `WhitelistPanel.tsx`, `useMinecraftWhitelist.ts`.
- `app/actions/gameservers/minecraftProfile.ts`: name → UUID lookup (Mojang API, server-side
  because Mojang sends no CORS headers; offline-mode UUIDs are derived from the name).
- Wiring: `components/gameserver/Console/gameDashboard.tsx` → `GameserverTabs.tsx`
  (`configComponent`, `configAttention`). Messages: `gameserver.tabs.config`, `gameserver.config.*`.

## Data flow

- Radix unmounts inactive tab content, so the attention hook runs in the (always mounted) tab
  trigger. It and the panels share files through `useServerFile`, so there is a single fetch and
  saves show up everywhere. Panels pass `revalidateOnMount` to pick up console / file-manager edits.
- `readFile` throws `FileNotFoundError` for a missing file, which the UI shows as "start the server once".
  Pterodactyl answers a missing file with a **500** (`DaemonConnectionException`), not a 404, so on any
  failed read `readFile` checks the parent directory listing; a failing listing keeps the original error.
- `useServerFile().update(fn)` re-reads the file from the server, applies `fn`, and writes it, so
  values the game server wrote in the meantime are kept.

## Properties format guarantees

Comments, blank lines, key order and every unchanged line are written back byte-for-byte.
Only changed keys are re-serialized (`key=value`, Java escaping, non-ASCII as `\uXXXX`).
New keys are appended at the end.

## Editor rules

- Only curated `ConfigField`s whose key exists in the file are shown (versions differ). There is
  one tab per curated category that has rows, with no "All" or "Other" tab. Keys without a
  curated field are only reachable through the search, which always covers every key and groups
  results by category ("More settings" for uncurated keys). They render as text inputs.
- `locked` fields (ports, IP) are read-only because Pterodactyl allocations own them.
- User-facing strings must not mention "Lake" (internal code name); say "automatically" etc.
- **Unknown values are never overwritten.** When a typed field's saved value isn't recognised
  (a boolean that isn't `true`/`false`, an enum value not in `options` such as a modded
  difficulty, a number that isn't an integer or is out of range), the row switches to a free
  text field with an amber "unknown value, but it may still work" hint. It also links the standard values,
  and clicking one switches back to the typed control. Enum selects also have a "Custom value…"
  entry. Save only writes keys the user actually changed.
- `excludeKeys` hides keys owned by another panel (`white-list`, `enforce-whitelist`), so two
  editors never write the same key.
- i18n: `ConfigField.id` is camelCase because next-intl splits keys on `.` (`query.port`). Labels
  live at `<namespace>.fields.<id>.{label,description,warning}`, plus `.categories.<id>` and
  `.options.<fieldId>.<optionId>`.
- Saving while the server is running/starting shows a "restart required" prompt.

## Minecraft whitelist write strategy

- **Players** (add/remove): always edit `whitelist.json` (`[{uuid,name}]`, 2-space JSON), then send
  `whitelist reload` if the server is running or starting (console input is queued).
- **On/off switch**: when running, send `whitelist on|off`. The server writes server.properties
  from its in-memory copy on that command, so a direct file edit would be overwritten.
  When offline, set `white-list` in `server.properties` directly. Disabled while starting/stopping.
- Disabling asks for confirmation ("not recommended").

## Adding a game

1. `components/gameserver/gameConfig/<game>/index.ts` exporting a `GameConfigModule`.
2. For file forms: `ConfigField[]` + `ConfigFileEditor` with a `ConfigFormat` (add a format in
   `lib/gameConfig/formats/` for JSON/INI etc.).
3. One line in `GAME_CONFIG_REGISTRY`, messages under `gameserver.config.<game>` (en + de).
