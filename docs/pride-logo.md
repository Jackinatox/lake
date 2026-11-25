# Animated Pride logo (concept stage)

The Scyed logo with the six Pride colors as solid blocks in the baseline ("J3"), which grow
around the whole cloud on hover or tap ("J5"). It is drawn on a canvas from a precomputed
"u-map", so the colors follow the cloud's curve. Six animation variants are compared on a
dev-only lab page.

## Where it is used

- Navbar home link (`components/Navbar.tsx`): static J3 via `ThemeImage`,
  `public/images/{light,dark}/logo/ScyedLogoPride.webp` (1084×482). These files were rendered
  from the u-map with the same `U_BASE` and palettes as `engine.ts`; if either changes,
  regenerate them so the navbar and footer match.
- Footer home link (`components/Footer.tsx`): `<PrideLogo variant="stretch" />`, animated.
  `PrideLogo` takes the variant **id**, so server components can render it.
- The original `ScyedLogo.webp` files are still used elsewhere and were not changed.

## Files

- `components/brand/prideLogo/engine.ts` — loads the u-map, paints a frame. A frame is 7
  boundaries in u; below `b[0]` the stroke is brand blue. Light/dark palettes, `U_BASE`
  (where the straight baseline starts), `J3_BOUNDS` / `J5_BOUNDS`.
- `components/brand/prideLogo/variants.ts` — the animation variants. `tween` variants map progress
  p (0 = J3, 1 = J5) to a frame; `spring` variants spring each boundary toward J3/J5.
- `components/brand/prideLogo/PrideLogo.tsx` — client component: RAF driver, hover (mouse) /
  tap toggle (touch, pen), `prefers-reduced-motion` jumps straight to the end state, `scrub` /
  `autoplay` props for the lab. Wordmark is a CSS mask filled with `currentColor`.
- `app/[locale]/dev/pride-logo/` — the lab at `/en/dev/pride-logo`; `notFound()` outside
  `next dev` (`lib/devMode.ts`), noindex.
- `public/images/pride/logo-cloud-umap.png` — per cloud pixel: u (0 = swoosh tip, 1 = baseline
  end) as 16 bit in R/G, coverage in B. Fully opaque on purpose: canvas alpha premultiplication
  would destroy values in semi-transparent pixels. u is the geodesic distance through the stroke
  `d_tip / (d_tip + d_end)`, computed from `public/images/light/logo/ScyedLogo.webp`.
- `public/images/pride/logo-wordmark-mask.png` — wordmark alpha only (baseline row removed).
- `public/images/pride/concepts/<slug>-<mode>.webp` — the logos from the earlier design rounds
  (transparent, light + dark), listed in `app/[locale]/dev/pride-logo/concepts.ts`; the lab shows
  them below the animations. The HTML concept boards they were exported from are not committed.

## Testing on a phone

`allowedDevOrigins` in `next.config.ts` takes extra hosts from `DEV_EXTRA_ORIGINS`, because
Next 16 blocks dev resources for other origins and the page would not hydrate:
`DEV_EXTRA_ORIGINS=<lan-ip> bun run --bun next dev -H 0.0.0.0`, then open
`http://<lan-ip>:3000/en/dev/pride-logo`.
