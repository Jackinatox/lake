# Modpack Beta Feedback & Kill Switch

User-facing feedback capture for the modpack beta, plus a database-driven kill
switch for the whole modpack feature. Built on the existing `KeyValue` table
and a new `Feedback` table. Everything lives in `lake`; no worker involvement.

---

## 1. Modpack kill switch (KeyValue)

One boolean row in the `KeyValue` table controls whether the Minecraft modpack
tab exists at all:

- **Key:** `minecraft_modpacks_enabled`, type `BOOLEAN`
- **Off by default**: only an existing row with `true` shows the modpack tab.
  A missing row or `false` → the tab is not rendered anywhere. This is
  deliberate (beta feature; must be safe to enable, try, and disable again) —
  do not flip the default back to `true`.
- Admins edit it at `/admin/keyvalue`. There is no seed entry; create the row
  with `true` to launch the beta.

### Wiring (server → client prop threading)

`getKeyValueBoolean(key, default)` in `lib/keyValue.ts` (request-cached, like
its string/number siblings) is called in every **server page** that renders the
game config UI, then threaded down as prop `modpacksEnabled`:

| Server page (fetches key) | Client component chain |
|---|---|
| `app/[locale]/order/[gameSlug]/setup/page.tsx` | `SetupPageClient.tsx` → `game-config.tsx` |
| `app/[locale]/order/free/[gameSlug]/page.tsx` | `FreeGameBookingSlug.tsx` → `game-config.tsx` |
| `app/[locale]/gameserver/[server_id]/changeGame/[gameSlug]/page.tsx` | `ChangeGameConfigClient.tsx` → `game-config.tsx` |

`components/booking2/game-config.tsx` forwards the prop only to
`MinecraftConfigComponent`. In
`components/booking2/GameInstallConfig/minecraft-config.tsx` the prop
(optional, defaults `true`) is ANDed into `modpacksAvailable` (~line 43), which
already gated the tab on the Modrinth egg id from
`GameData.data.modpackPlatforms`. Other games ignore the prop.

The beta *note* (yellow alert inside the modpack tab) is plain i18n
(`gameConfig.minecraft.modpackBeta.*` in `messages/*.json`) and is not
DB-configurable — it disappears only by editing the component.

## 2. Feedback storage (Prisma)

`prisma/schema.prisma` — migration `20260725162538_feedback`:

- `enum FeedbackType { MODPACK_BETA GENERAL }` — extend this enum for future
  feedback campaigns instead of new tables.
- `model Feedback`: `id`, `type`, `title?`, `message? @db.Text`,
  `data Json @default("{}")`, `userId` (cascade-delete relation to `User`),
  `gameServerId?` (string, the same id used in `/gameserver/[server_id]`
  routes — NOT a Prisma relation), `createdAt`. Indexed on `userId`, `type`,
  `gameServerId`.

One row per submission. `data` holds the structured survey answers plus
auto-captured context, validated by `feedbackDataSchema`:
`outcome? ('worked'|'partial'|'failed')`, `issues? string[]`,
`rating? int 1–5`, `modpackId?`, `modpackVersion?`, `locale?`.

## 3. Server actions & validation

- `lib/validation/feedback.ts` — zod schemas `feedbackDataSchema`,
  `submitFeedbackSchema`; types `FeedbackData`, `SubmitFeedbackInput`.
- `app/actions/feedback/feedbackActions.ts` (`'use server'`):
  - `submitFeedbackAction(input)` — requires session; when `gameServerId` is
    set, verifies ownership via
    `app/data-access-layer/gameServer/getOwnedGameServerSummary`; creates the
    row. Returns `{ id, createdAt }`.
  - `getMyFeedbackAction(gameServerId)` — current user's rows for that server,
    newest first, limit 20 (`MyFeedbackRow`).

There is no admin UI for reading feedback yet — query the table directly.

## 4. Dashboard survey card (UI)

`components/gameserver/feedback/ModpackFeedbackCard.tsx` (`'use client'`):

- Mounted in `app/[locale]/gameserver/[server_id]/page.tsx` below
  `<ServerLoader />`, **only when `gameData.slug === 'minecraft'`**. The page
  fetches the user's previous feedback server-side (direct
  `prisma.feedback.findMany`, same shape as `getMyFeedbackAction`) and passes
  it as `initialFeedback`, plus `modpackId`/`modpackVersion` extracted from
  the parsed `gameConfig.modpack` (`projectId`/`versionId`) and the locale.
- Collapsed by default to a single slim row (shadcn `Collapsible`). Expanded:
  outcome radio, six issue checkboxes (`install_failed`, `wont_start`,
  `crashes`, `wrong_mod_versions`, `performance`, `confusing_ui`), 1–5 star
  rating, optional textarea. Submits via `submitFeedbackAction` with
  `type: 'MODPACK_BETA'`; success prepends the entry to the previous-feedback
  list in place.
- Previous feedback renders as plain muted text rows. **Do not introduce
  badge/chip UI here** — explicit owner preference.
- i18n namespace: `gameserver.feedback.*` in both `messages/en.json` and
  `messages/de.json` (informal "Du" German).

## 5. Extending

- New survey fields → add to `feedbackDataSchema` (keep keys optional for
  backward compatibility with existing rows) and to the card's form + i18n.
- Feedback for other games/features → reuse the table with a new
  `FeedbackType` value and a new (or generalized) card component.
- Admin readout → new page under `app/[locale]/admin/`, follow
  `app/actions/keyvalue/keyValueActions.ts` for the admin-guard pattern.
