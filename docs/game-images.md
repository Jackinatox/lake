# Game images

Three sets of per-game artwork live under `public/images/`, keyed by the `GameData.slug`
(`minecraft`, `satisfactory`, `factorio`, `hytale`, `valheim`). Nothing is stored in the
database — a file either exists for a slug or it does not.

| Set             | Path                                                 | Typical use                                      |
| --------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Themed **icon** | `public/images/{light,dark}/games/icons/<slug>.webp` | small marks: lists, dropdowns, cards, order flow |
| Banner          | `public/images/games/banners/<slug>.jpg`             | wide header art on the order pages               |

## The themed pair, and how to render it

The icon exists twice — once under `light/`, once under `dark/` — and
`components/ui/theme-image.tsx` is what picks between them. Callers pass the path
**without** the theme segment:

```tsx
<ThemeImage src={`games/icons/${game.slug}.webp`} alt="" width={16} height={16} />
```

`ThemeImage` renders both files and hides one with `dark:hidden` / `hidden dark:block`, so
the swap happens in CSS and survives SSR. It normalizes the `src`, so
`games/icons/x.webp`, `/images/games/icons/x.webp` and `/images/light/games/icons/x.webp`
all resolve to the same pair — never hand-build `/images/dark/...` yourself.

Banners are a single file and are rendered with a plain `next/image`.

## Missing icons

A game can be added to `GameData` before anyone draws its icon, and `<Image>` on a missing
file leaves a broken image in the UI. `lib/gameIcons.ts` (`hasGameIcon(slug)`) answers that
server-side from one cached directory listing of the light icon folder; the admin filter bar
uses it to decide whether to render the icon at all. The listing is re-read on every call in
development, so a newly added file shows up without a restart.

## Who renders them

- `app/[locale]/admin/gameservers/ServerFilters.tsx` — the admin panel's Game filter.
- `app/[locale]/order/**` — game cards, landing, setup and configure flows.
- `app/[locale]/SupportedGamesList.tsx`, `components/order/PackageCard.tsx`.
- `app/sitemap.ts` lists both theme variants as image entries, and
  `app/webhook/handleRefundWebhooks.ts` embeds the **light** icon in refund emails (mail
  clients have no theme to follow).

## Adding a game

Drop `<slug>.webp` into **both** `public/images/light/games/icons/` and
`public/images/dark/games/icons/` (same name as the `GameData.slug`), plus
`<slug>.jpg` in `public/images/games/banners/` if the game gets order pages. Keep the icon
square and small — the existing ones are a few KB to ~250 KB. If an icon only reads on one
background, that is exactly what the two folders are for; otherwise the same file in both is
fine, which is what the current five games do.
