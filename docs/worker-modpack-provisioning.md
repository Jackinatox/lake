# Worker: Modrinth Modpack Provisioning

Spec for the change the **external worker** needs so it can provision Minecraft
servers from a Modrinth modpack, in addition to the existing flavor servers.

This document describes the contract only. The worker lives in a separate repo
(`WORKER_IP`), so the exact code is not in `lake`. **Before implementing, verify
the assumptions in [§5](#5-verify-before-you-start) against the real worker and
the imported egg — several values below are placeholders.**

---

## 1. Background — how provisioning is triggered today

Nothing changes in the trigger path:

1. `lake` creates a `GameServerOrder` and POSTs `{ orderId }` to
   `${WORKER_IP}/v1/queue/provision` (`lib/Pterodactyl/createServers/provisionServer.ts`).
2. The worker reads the order from the shared database and creates the
   Pterodactyl server from `order.gameConfig` (+ hardware/location fields).

The only thing that changes is **how the worker reads one new optional field on
`gameConfig` and which egg variables it sets**.

## 2. The data contract (`order.gameConfig`)

`gameConfig` is the JSON validated by `gameConfigSchema` in
`lib/validation/order.ts`. The Minecraft branch now looks like this:

```jsonc
{
  "gameSlug": "minecraft",
  "eggId": 22,                                  // see below
  "version": "1.20.1",                          // Minecraft version
  "dockerImage": "ghcr.io/pterodactyl/yolks:java_17", // already resolved by lake
  "gameSpecificConfig": {
    "serverName": "My Server",
    "maxPlayers": 20,
    "viewDistance": 10,
    "difficulty": "normal",
    "enablePvp": true,
    "enableNether": true,
    "enableCommandBlocks": true,
    "spawnProtection": 16,
    "allowFlight": false,
    "flavor": "Modpack"                          // literal string "Modpack" in modpack mode
  },

  // NEW — present ONLY when the user chose a modpack. Absent for flavor servers.
  "modpack": {
    "platform": "modrinth",                      // only value today; curseforge later
    "projectId": "1KVo5zza",                     // Modrinth project id
    "versionId": "g5RAIwpP",                     // Modrinth version id
    "name": "Fabulously Optimized"               // display name, for logs/labels
  }
}
```

Key point: **`lake` has already done the version → Java mapping.** When `modpack`
is present, `eggId` is the Modrinth installer egg's id and `dockerImage` is the
Java image that egg should run, chosen from the egg's own image list. The worker
does **not** need to recompute either — use `gameConfig.eggId` and
`gameConfig.dockerImage` exactly as it does for flavor servers.

## 3. What the worker must do

```
if (gameConfig.modpack) {
    // ---- MODPACK PATH (new) ----
    egg          = gameConfig.eggId        // Modrinth Generic egg
    dockerImage  = gameConfig.dockerImage  // already resolved
    eggVariables = {
        PROJECT_ID: gameConfig.modpack.projectId,
        VERSION_ID: gameConfig.modpack.versionId,
        // + any required defaults the egg declares (see §5)
    }
} else {
    // ---- FLAVOR PATH (unchanged) ----
    // existing behavior: flavor egg + server.properties from gameSpecificConfig
}
```

Concretely, in the Pterodactyl **create server** admin API call:

- `egg` = `gameConfig.eggId`
- `docker_image` = `gameConfig.dockerImage`
- `nest` = whatever the worker uses today (Minecraft nest) — unchanged
- `environment` = the egg's required variables, with `PROJECT_ID` and
  `VERSION_ID` set from `gameConfig.modpack`. Include every variable the egg
  marks as required (e.g. `BUILD_NUMBER`, `SERVER_JARFILE`, EULA) using the
  egg's declared defaults; an unset required variable makes the create call fail.
- `startup` = the egg's default startup command (do not reuse the flavor egg's).

### server.properties / `gameSpecificConfig`

The Modrinth modpack ships its own configs via `overrides/`, and the install
script writes a fresh `server.properties`. Decide one of:

- **Recommended for v1:** do **not** push `gameSpecificConfig` fields
  (maxPlayers, difficulty, …) onto a modpack server — let the pack's own config
  win. The fields are still stored on the order for display/history.
- If you do want to apply them, write them **after** install completes (e.g. via
  the Pterodactyl file API on `server.properties`), not as egg variables — the
  Modrinth egg does not accept them as variables.

Flag which you chose; see [§6](#6-open-questions--ask-back).

## 4. Status, failures, and the install lifecycle

- Server creation success/failure maps to the existing `GameServerStatus`
  (`CREATED` → `ACTIVE`, `CREATION_FAILED`) and `ProvisioningStatus` exactly as
  for flavor servers. No new states are needed.
- **Modpack installs fail more often than vanilla** (network, a pack with no
  server files, a NeoForge pack the egg can't handle). The install runs inside
  Pterodactyl's install container, so a failure surfaces there, not in the
  create call. Make sure the worker's existing install-result handling captures
  the install log / failure for these servers too, and records it on the order
  (`errorText`) so support can see it.
- Reinstall semantics (for a future "change modpack version" feature): changing
  `VERSION_ID` + reinstalling re-runs the script but does **not** wipe the
  volume, so stale mods can remain. Out of scope for v1 — note it for later.

## 5. Verify before you start

Do not trust the placeholder values above. Check the live system first:

1. **Egg id.** Confirm the imported "Modrinth Generic" egg id in Pterodactyl
   matches `GameData.data.modpackPlatforms.modrinth.egg_id` for the `minecraft`
   row in the database. The seed placeholder is `22` — confirm the real value.
2. **Egg variable names.** Open the egg in the panel and confirm the variable
   env names are exactly `PROJECT_ID` and `VERSION_ID`. If you forked/renamed the
   egg, adjust the worker accordingly. List **all** required variables and their
   defaults.
3. **Docker images.** Confirm `GameData.data.modpackPlatforms.modrinth.dockerImages`
   lists the images the egg actually declares. `lake` picks `dockerImage` from
   this list, so if the egg needs a custom image with extra deps it must be in
   that DB list, not just on the egg.
4. **Create-server payload shape.** Re-read how the worker builds the existing
   flavor create call and mirror its structure; only swap egg id, docker image,
   startup, and the environment map.
5. **DB enum/JSON access.** Confirm the worker reads `gameConfig` as JSON and can
   see the new `modpack` key (it's plain JSON, no migration, but verify the
   worker isn't using a stale typed shape that strips unknown keys).

## 6. Open questions — ask back

If any of these are unclear or the real system disagrees with this spec, **stop
and ask `lake`'s maintainer rather than guessing**:

- [ ] Real Modrinth egg id and its full required-variable list + defaults?
- [ ] Are the egg's variable names `PROJECT_ID` / `VERSION_ID`, or renamed?
- [ ] Should `gameSpecificConfig` (maxPlayers, difficulty, …) be applied to
      modpack servers, or ignored in favor of the pack's own config?
- [ ] Does the worker's current install-result/error handling already cover this
      path, or does it special-case flavor eggs anywhere?
- [ ] Any allocation/port logic that keys off the flavor egg id and would need a
      branch for the modpack egg?

## 7. Out of scope for this change

- CurseForge (a second platform/egg comes later; `platform` already
  discriminates, so add a branch then).
- In-panel "update/switch modpack version" after creation.
- Free-tier gating (RAM is usually too low for modpacks — decided in `lake`, not
  the worker).
